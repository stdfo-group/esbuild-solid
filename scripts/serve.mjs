import http from 'http'
import url from 'url'
import path from 'path'
import fs from 'fs'

// eslint-disable-next-line no-undef
const port = process.argv[2] || 8888

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

function getCompressMethod(req) {
  var headers = req.headers

  if (headers && headers['accept-encoding']) {
    const requestEncodings = headers['accept-encoding'].split(',').map(el => el.trim())

    if (requestEncodings.includes('br')) {
      return 'br'
    }
    if (requestEncodings.includes('gzip') || requestEncodings.includes('compress') || requestEncodings.includes('*')) {
      return 'gzip'
    }
    return null
  }
  return null
}

http
  .createServer(function (request, response) {
    const uri = url.parse(request.url).pathname
    console.log(`${request.method} ${uri}`)
    // eslint-disable-next-line no-undef
    let filename = path.join(process.cwd(), 'dist', uri)

    fs.exists(filename, function (exists) {
      if (!exists) {
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
      const encoding = getCompressMethod(request)
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
    })
  })
  .listen(parseInt(port, 10))

console.log(
  `Static file server running at\n  => http://localhost:${port}/ \nCTRL + C to shutdown, CTRL + F5 for favicon`
)
