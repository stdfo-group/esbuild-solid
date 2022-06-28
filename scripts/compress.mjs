import fs from 'fs'
import { gzipSync, brotliCompressSync } from 'zlib'

const writeGzipCompress = (path, contents, options = {}) => {
  const compressed = gzipSync(contents, options)
  fs.writeFileSync(`${path}.gz`, compressed)
  logDelta(path, `${path}.gz`, 'gzip')
}

const writeBrotliCompress = (path, contents, options = {}) => {
  const compressed = brotliCompressSync(contents, options)
  fs.writeFileSync(`${path}.br`, compressed)
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

export const compress = (options = {}) => {
  const gzip = options.gzip ?? true
  const brotli = options.brotli ?? true
  const gzipOpts = options.gzipOptions ?? {}
  const brotliOpts = options.brotliOptions ?? {}
  const dirs = options.dirs ?? ['dist']

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
