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

      fs.readFile(filename, 'binary', function (err, file) {
        if (err) {
          response.writeHead(500, { 'Content-Type': 'text/plain' })
          response.write(err + '\n')
          response.end()
          return
        }

        var headers = {}
        headers['access-control-allow-origin'] = '*'
        var contentType = contentTypesByExtension[path.extname(filename)]
        if (contentType) headers['Content-Type'] = contentType
        response.writeHead(200, headers)
        response.write(file, 'binary')
        response.end()
      })
    })
  })
  .listen(parseInt(port, 10))

console.log(
  `Static file server running at\n  => http://localhost: ${port}/\nCTRL + C to shutdown, CTRL + F5 for favicon`
)
