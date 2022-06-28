// eslint-disable-next-line no-redeclare
import crypto from 'crypto'
import esbuild from 'esbuild'
import { promises as fs } from 'fs'
import { createServer } from 'http'
import path from 'path'
import { solidPlugin } from 'esbuild-plugin-solid'
import url from 'url'

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

const contentTypesByExtension = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ico': 'image/x-icon',
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
              }
            } else {
              for (const [key, client] of Object.entries(clients)) {
                console.debug('Sending changed stylesheets to client', key)

                for (const changedFile of changedFiles) {
                  client.write(`id: ${Date.now()}\nevent: stylesheet\ndata: ${changedFile}\n\n`)
                }
              }
            }
          }
        }
      },
    },
  })
}
// eslint-disable-next-line no-undef
const htmlPath = path.resolve(process.cwd(), config.fileConfig.html)

const html = (await fs.readFile(htmlPath)).toString().replace(
  '</body>',
  `<script>
                const sse = new EventSource("/sse");
                sse.addEventListener('reload', () => window.location.reload())
                sse.addEventListener('stylesheet', (e) => document.querySelector(\`link[href^="\${e.data}"]\`).href = \`\${e.data}?${Date.now()}\`)
              </script></body>`
)

const server = createServer()
// sse
server.on('request', (req, res) => {
  if (req.url === '/sse') {
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
// html
server.on('request', (req, res) => {
  if (req.url === '/' || req.url === '') {
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('access-control-allow-origin', '*')
    res.writeHead(200)
    res.end(html)
  }
})
// ico, js, css
server.on('request', (req, res) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.ico') || req.url.endsWith('.css')) {
    const uri = url.parse(req.url).pathname
    // eslint-disable-next-line no-undef
    const filename = path.join(process.cwd(), config.config.outdir, uri)
    let headers = { 'access-control-allow-origin': '*' }

    const contentType = contentTypesByExtension[path.extname(filename)]
    if (contentType) {
      headers['Content-Type'] = contentType
    }
    console.log(filename)
    fs.readFile(filename)
      .then(contents => {
        res.writeHead(200, headers)
        res.write(contents, 'binary')
        res.end()
      })
      .catch(err => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.write('404 Not Found\n')
            res.end()
            return
          }
          res.writeHead(500, { 'Content-Type': 'text/plain' })
          res.write(err + '\n')
          res.end()
          return
        }
      })
  }
})

const keepAliveInterval = setInterval(() => {
  for (const [key, client] of Object.entries(clients)) {
    console.debug('Pinging client', key)

    client.write(`:\n\n`)
  }
}, 10000)
// eslint-disable-next-line no-undef
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
