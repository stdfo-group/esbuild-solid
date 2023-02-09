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

const contentTypesByExtension = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
}

const endocdingToExtension = {
  gzip: '.gz',
  br: '.br',
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value)
}

function preloadContentEncodings() {
  // TODO: replace via generator
  let result = { gzip: [], br: [] }
  const extensions = Object.values(endocdingToExtension)

  readdirSync(serveDir).forEach(file => {
    extensions.forEach(element => {
      const key = getKeyByValue(endocdingToExtension, element)
      if (file.endsWith(element)) {
        result[key] = [...result[key], file.replace('.br', '').replace('.gz', '')]
      }
    })
  })
  return result
}

function getEncodings(req) {
  const headers = req.headers
  let encodingType = []
  if (headers && headers['accept-encoding']) {
    const requestEncodings = headers['accept-encoding'].split(',').map(el => el.trim())

    if (requestEncodings.includes('br')) {
      encodingType.push('br')
    }
    if (requestEncodings.includes('gzip') || requestEncodings.includes('compress') || requestEncodings.includes('*')) {
      encodingType.push('gzip')
    }
  }
  return encodingType
}

function handler(request, response) {
  const startTime = performance.now()
  const uri = url.parse(request.url).pathname
  let filename = path.join(serveDir, uri)

  if (!fs.existsSync(filename)) {
    response.writeHead(404, { 'Content-Type': 'text/plain' })
    response.write('404 Not Found\n')
    response.end()
    return
  }

  if (fs.statSync(filename).isDirectory()) {
    filename += 'index.html'
  }

  let headers = { 'access-control-allow-origin': '*' }

  const contentType = contentTypesByExtension[path.extname(filename)]
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const encodings = getEncodings(request)
  if (encodings != []) {
    for (let i = 0; i < encodings.length; i++) {
      const curEncoding = encodings[i]
      if (contents[curEncoding].find(i => i === filename)) {
        const tmpFilename = filename + endocdingToExtension[curEncoding]
        if (fs.existsSync(tmpFilename)) {
          filename = tmpFilename
          response.setHeader('Content-Encoding', curEncoding)
        }
        break
      }
    }
  }

  fs.readFile(filename, 'binary', function (err, file) {
    if (err) {
      response.writeHead(500, { 'Content-Type': 'text/plain' })
      response.write(err + '\n')
      response.end()
      return
    }

    response.writeHead(200, headers)
    response.write(file, 'binary')
    response.end()
    const endTime = (performance.now() - startTime).toFixed(3)
    console.log(`${request.method} ${uri} --- ${filename} --- ${endTime} ms`)
  })
}

const contents = preloadContentEncodings()

http.createServer(handler).listen(parseInt(port, 10))

console.log(
  `Static file server running at\n  => http://localhost:${port}/ \nCTRL + C to shutdown, CTRL + F5 for favicon`
)
