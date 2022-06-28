import connect from 'connect'
import serveStatic from 'serve-static'
import crypto from 'crypto'
import esbuild from 'esbuild'
import { promises as fs } from 'fs'
import { createServer } from 'http'
import path from 'path'
import { solidPlugin } from 'esbuild-plugin-solid'

const env = 'dev'
const config = {
  config: {
    entryPoints: ['./src/index.tsx'],
    outdir: './dist_dev',
    bundle: true,
    minify: false,
    plugins: [solidPlugin()],
  },
  fileConfig: {
    output: 'dist_dev',
    html: './public/index.html',
  },
}

let builder
let clients = {}
let outputFilesHashesGlobal = new Map()

async function watch() {
  builder = await esbuild.build({
    ...config.config,
    watch: {
      onRebuild: async error => {
        if (error) {
          console.error('Rebuild', env.toLowerCase(), 'failed', error)
        } else {
          console.log('Rebuild', env.toLowerCase())

          const changedFiles = []

          try {
            const files = await fs.readdir(config.fileConfig.output)

            const outputFilesHashes = await Promise.all(
              files.map(file =>
                fs.readFile(path.join(config.fileConfig.output, file)).then(buffer => {
                  const hash = crypto.createHash('md5')

                  hash.update(buffer)

                  return [file, hash.digest('hex')]
                })
              )
            )

            for (const [file, hash] of outputFilesHashes) {
              let previousHash

              if ((previousHash = outputFilesHashesGlobal.get(file))) {
                if (previousHash !== hash) {
                  console.log('Changed file', file)

                  changedFiles.push(file)
                }
              }

              outputFilesHashesGlobal.set(file, hash)
            }
          } catch (e) {
            console.error('Changes', env.toLowerCase(), 'failed', e)
          } finally {
            if (changedFiles.length === 0 || changedFiles.some(changedFile => !changedFile.endsWith('.css'))) {
              for (const [key, client] of Object.entries(clients)) {
                console.debug('Reloading client', key)

                client.write(`id: ${Date.now()}\nevent: reload\ndata: ${changedFiles.join(',')}\n\n`)

                // client.flush()
              }
            } else {
              for (const [key, client] of Object.entries(clients)) {
                console.debug('Sending changed stylesheets to client', key)

                for (const changedFile of changedFiles) {
                  client.write(`id: ${Date.now()}\nevent: stylesheet\ndata: ${changedFile}\n\n`)
                }

                // client.flush()
              }
            }
          }
        }
      },
    },
  })
}

async function dev() {
  if (config.fileConfig === null) {
    return
  }

  if (typeof config.fileConfig.html === 'undefined') {
    console.end('Cannot use esbuild in renderer without specifying a html file in `rendererConfig.html`')
  }

  const htmlPath = path.resolve(process.cwd(), config.fileConfig.html)

  const html = (await fs.readFile(htmlPath)).toString().replace(
    '</body>',
    `<script>
                const sse = new EventSource("/sse");
                sse.addEventListener('reload', () => window.location.reload())
                sse.addEventListener('stylesheet', (e) => document.querySelector(\`link[href^="\${e.data}"]\`).href = \`\${e.data}?${Date.now()}\`)
              </script></body>`
  )

  const handler = connect()

  let publicPath = ''

  if (config.config.outdir !== undefined && config.config.outfile === undefined) {
    publicPath = config.config.outdir
  } else if (config.config.outdir === undefined && config.config.outfile !== undefined) {
    publicPath = path.dirname(config.config.outfile)
  } else {
    console.end('Missing outdir/outfile in esbuild configuration. This is maybe an error from electron-esbuild.')
  }

  handler.use(serveStatic(publicPath, { index: false }))
  handler.use((req, res) => {
    if (req.url === '/' || req.url === '') {
      res.setHeader('Content-Type', 'text/html')
      res.setHeader('access-control-allow-origin', '*')
      // res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
      // res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
      res.writeHead(200)
      res.end(html)
    } else if (req.url === '/sse') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })

      const key = crypto.randomBytes(8).toString('hex')

      console.debug('Client connected', key)

      clients[key] = res

      req.on('close', () => {
        console.debug('Client disconnected', key)

        delete clients[key]
      })
    }
  })

  const server = createServer(handler)

  const keepAliveInterval = setInterval(() => {
    for (const [key, client] of Object.entries(clients)) {
      console.debug('Pinging client', key)

      client.write(`:\n\n`)
      // client.flush()
    }
  }, 10000)

  process.on('exit', async () => {
    clearInterval(keepAliveInterval)

    for (const [key, client] of Object.entries(clients)) {
      console.debug('Ending client', key)

      client.end()
    }

    server.close()
    builder?.stop?.()
  })

  server.listen(9080)

  watch()
}

dev()
