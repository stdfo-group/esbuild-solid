import * as esbuild from 'esbuild'
import { promises as fs } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { devconf, devport, devoutdir } from '../config.mjs'
import http from 'node:http'

// eslint-disable-next-line no-undef
const proc = process
const onExit = _signal => {
  ctx.dispose()
  server.close()
  fs.rm(devoutdir, { recursive: true, force: true }).then(() => {
    console.log('Bye!')
    proc.exit()
  })
}
proc.on('SIGINT', onExit)
proc.on('SIGTERM', onExit)
proc.on('exit', onExit)

let ctx = await esbuild.context(devconf)
await ctx.watch({})
let { host, port } = await ctx.serve({ servedir: devoutdir })

const server = createServer()
server.on('request', async (req, res) => {
  const options = {
    hostname: host,
    port: port,
    path: req.url,
    method: req.method,
    headers: req.headers,
  }
  console.log(`${new Date()} <--- ${req.method} ${req.url}`)
  if (req.url === '/' || req.url === '') {
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('access-control-allow-origin', '*')
    res.writeHead(200)
    const html = (await fs.readFile(path.join(devoutdir, 'index.html')))
      .toString()
      .replace(
        '</body>',
        `<script>new EventSource('/esbuild').addEventListener('change', () => location.reload())</script></body>`
      )
    res.end(html)
    console.log(`${new Date()} ---> ${res.statusCode} ${req.url}`)
  } else {
    const proxyReq = http.request(options, proxyRes => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res, { end: true })
      console.log(`${new Date()} ---> ${proxyRes.statusCode} ${req.url}`)
    })
    req.pipe(proxyReq, { end: true })
  }
})

server.listen(devport, () => {
  console.log(`=> http://localhost:${devport}/ \nCTRL + C to shutdown`)
})
