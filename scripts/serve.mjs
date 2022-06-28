import http from 'http'
import url from 'url'
import path from 'path'
import fs from 'fs'

// eslint-disable-next-line no-undef
const serveDir = process.argv[2] || 'dist'
// eslint-disable-next-line no-undef
const port = process.argv[3] || 8000

const contentTypesByExtension = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ico': 'image/x-icon',
}

const endocdingToExtension = {
  gzip: '.gz',
  br: '.br',
}

function getEncoding(req) {
  const headers = req.headers
  let encodingType = null
  if (headers && headers['accept-encoding']) {
    const requestEncodings = headers['accept-encoding'].split(',').map(el => el.trim())

    if (requestEncodings.includes('br')) {
      encodingType = 'br'
    } else {
      if (
        requestEncodings.includes('gzip') ||
        requestEncodings.includes('compress') ||
        requestEncodings.includes('*')
      ) {
        encodingType = 'gzip'
      }
    }
  }
  return encodingType
}

function handler(request, response) {
  const uri = url.parse(request.url).pathname
  console.log(`${request.method} ${uri}`)
  // eslint-disable-next-line no-undef
  let filename = path.join(process.cwd(), serveDir, uri)

  if (!fs.existsSync(filename)) {
    response.writeHead(404, { 'Content-Type': 'text/plain' })
    response.write('404 Not Found\n')
    response.end()
    return
  }

  if (fs.statSync(filename).isDirectory()) {
    filename += '/index.html'
  }

  var headers = { 'access-control-allow-origin': '*' }

  const contentType = contentTypesByExtension[path.extname(filename)]
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const encoding = getEncoding(request)
  if (encoding != null) {
    var tmpFilename = filename + endocdingToExtension[encoding]
    if (fs.existsSync(tmpFilename)) {
      filename += endocdingToExtension[encoding]
      response.setHeader('Content-Encoding', encoding)
    }
  }

  console.log(filename)
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
  })
}

http.createServer(handler).listen(parseInt(port, 10))

console.log(
  `Static file server running at\n  => http://localhost:${port}/ \nCTRL + C to shutdown, CTRL + F5 for favicon`
)
