import http from 'node:http'
import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { readdirSync } from './utils.mjs'
import { outdir, serveport } from '../config.mjs'

class Pipeline {
  #context = { logger: console.log }
  constructor(context) {
    Object.assign(this.#context, context)
  }

  then(func) {
    !this.#context.finalize && func(this.#context)
    return this
  }
}

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
      mime: mimeTypes[path.extname(sourceFile)],
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

function writeReponse(response, data, code = 200, encoding = 'utf-8', headers = defaultHeaders) {
  response.writeHead(code, headers)
  response.write(data, encoding)
  response.end()
}

const startPerf = ctx => (ctx.startExecute = performance.now())
const useCache = ctx => (ctx.cachedInfo = getCachedInfo(ctx.req, cache))
const writeResp = ctx => {
  if (ctx.cachedInfo.from_cache == null) {
    ctx.logger = console.warn
    writeReponse(ctx.res, '404 Not Found\n', 404)
    return
  }

  fs.readFile(ctx.cachedInfo.from_cache, 'binary', function (err, file) {
    if (err) {
      writeReponse(ctx.res, err + '\n', 500)
      ctx.logger = console.error
      ctx.err = err
      return
    }

    writeReponse(ctx.res, file, 200, 'binary', ctx.cachedInfo.headers)
  })
}
const endPerf = ctx => (ctx.endExecute = performance.now())
const logStat = ctx => {
  const endTime = (ctx.endExecute - ctx.startExecute).toFixed(3)
  ctx.err && ctx.logger(ctx.err)
  ctx.logger(
    `${ctx.res.statusCode} ${ctx.req.method} ${ctx.cachedInfo.from_url} --- ${ctx.cachedInfo.from_cache} --- ${endTime} ms`
  )
}

http
  .createServer((req, res) => {
    new Pipeline({ req, res, logger: console.log })
      .then(startPerf)
      .then(useCache)
      .then(writeResp)
      .then(endPerf)
      .then(logStat)
  })
  .listen(parseInt(port, 10), _ => {
    console.log(`Static file server running at\n  => http://localhost:${port}/ \nCTRL + C to shutdown`)
  })
