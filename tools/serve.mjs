import http from 'node:http'
import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { readdirSync } from './utils.mjs'
import { outdir, serveport } from '../config.mjs'

// eslint-disable-next-line no-undef
const serveDir = process.argv[2] || outdir
// eslint-disable-next-line no-undef
const port = process.argv[3] || serveport
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
}
const defaultHeaders = { 'access-control-allow-origin': '*', 'Content-Type': 'text/plain' }
const cache = createCache(serveDir)
const fileNames = Object.keys(cache)

function createCache(dir) {
  const result = {}
  readdirSync(dir).forEach(file => {
    const isGzip = file.endsWith('.gz')
    const isBrotli = file.endsWith('.br')
    const sourceFile = file.replace('.gz', '').replace('.br', '')
    result[sourceFile] = {
      filename: sourceFile,
      gzip: result[sourceFile]?.gzip || (isGzip && file),
      brotli: result[sourceFile]?.brotli || (isBrotli && file),
      mime: result[sourceFile]?.mime ?? mimeTypes[path.extname(sourceFile)],
    }
  })
  return result
}

function getCachedInfo(req, cache) {
  const uri = url.parse(req.url).pathname
  const filename = path.join(serveDir, uri.length == 1 ? 'index.html' : uri)
  const result = {
    from_url: filename,
    from_cache: null,
    headers: { 'access-control-allow-origin': '*', 'Content-Type': cache[filename]?.mime ?? null },
  }
  const headers = req.headers

  if (headers && headers['accept-encoding'] && fileNames.indexOf(filename) >= 0) {
    const requestEncodings = headers['accept-encoding'].split(',').map(el => el.trim())

    if (cache[filename].brotli && requestEncodings.includes('br')) {
      result.from_cache = cache[filename].brotli
      result.headers['Content-Encoding'] = 'br'
    } else if (
      cache[filename].gzip &&
      (requestEncodings.includes('gzip') || requestEncodings.includes('compress') || requestEncodings.includes('*'))
    ) {
      result.from_cache = cache[filename].gzip
      result.headers['Content-Encoding'] = 'gzip'
    } else {
      result.from_cache = filename
      return result
    }
  }

  return result
}

function writeReponse(response, data, code = 200, headers = defaultHeaders) {
  response.writeHead(code, headers)
  response.write(data)
  response.end()
}

function handler(request, response) {
  const startTime = performance.now()
  let cachedInfo = getCachedInfo(request, cache)

  if (cachedInfo.from_cache == null) {
    writeReponse(response, '404 Not Found\n', 404)
    const endTime = (performance.now() - startTime).toFixed(3)
    console.warn(`404 ${request.method} ${cachedInfo.from_url} --- ${cachedInfo.from_cache} --- ${endTime} ms`)
    return
  }

  fs.readFile(cachedInfo.from_cache, 'binary', function (err, file) {
    if (err) {
      writeReponse(response, err + '\n', 500)
      const endTime = (performance.now() - startTime).toFixed(3)
      console.error(
        `${err}\n\n500 ${request.method} ${cachedInfo.from_url} --- ${cachedInfo.from_cache} --- ${endTime} ms`
      )
      return
    }

    response.writeHead(200, cachedInfo.headers)
    response.write(file, 'binary')
    response.end()
    const endTime = (performance.now() - startTime).toFixed(3)
    console.log(`200 ${request.method} ${cachedInfo.from_url} --- ${cachedInfo.from_cache} --- ${endTime} ms`)
  })
}

http.createServer(handler).listen(parseInt(port, 10))
console.log(`Static file server running at\n  => http://localhost:${port}/ \nCTRL + C to shutdown`)
