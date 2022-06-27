import fs from 'fs'
import { gzipSync, brotliCompressSync } from 'zlib'

const writeGzipCompress = (path, contents, options = {}) => {
  const gzipped = gzipSync(contents, options)
  fs.writeFileSync(`${path}.gz`, gzipped)
  logDelta(path, `${path}.gz`, 'gzip')
}

const writeBrotliCompress = (path, contents, options = {}) => {
  const gzipped = brotliCompressSync(contents, options)
  fs.writeFileSync(`${path}.br`, gzipped)
  logDelta(path, `${path}.br`, 'brotli')
}

const logDelta = (sourcePath, compressedPath, type) => {
  const sourceSize = fs.statSync(sourcePath).size
  const sourceSizeKb = roundOff(sourceSize * 0.001)
  const compressedSize = fs.statSync(compressedPath).size
  const compressedSizekb = roundOff(compressedSize * 0.001)
  const rate = ((compressedSize / sourceSize) * 100).toFixed(2)
  console.log(`${sourcePath}\t${type}\t${sourceSizeKb} -> ${compressedSizekb}\t${rate}%`)
}

const roundOff = value => Math.round(value * 100) / 100

const dirs = ['dist']

export const compress = (options = {}) => {
  const gzip = options.gzip ?? true
  const brotli = options.brotli ?? true
  const gzipOpts = options.gzipOptions ?? {}
  const brotliOpts = options.brotliOptions ?? {}
  if (brotli || gzip) {
    dirs.forEach(dir => {
      fs.readdirSync(dir).forEach(file => {
        // TODO: html?
        if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
          const filename = dir + '/' + file
          gzip && writeBrotliCompress(filename, fs.readFileSync(dir + '/' + file), brotliOpts)
          brotli && writeGzipCompress(filename, fs.readFileSync(dir + '/' + file), gzipOpts)
        }
      })
    })
  }
}
