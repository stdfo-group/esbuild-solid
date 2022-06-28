import fs from 'fs'
import path from 'path'
import zlib, { gzipSync, brotliCompressSync } from 'zlib'

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
  const sourceSizeKb = Math.round(sourceSize * 0.1) / 100
  const compressedSize = fs.statSync(compressedPath).size
  const compressedSizekb = Math.round(compressedSize * 0.1) / 100
  const rate = ((compressedSize / sourceSize) * 100).toFixed(2)
  console.log(`${sourcePath}\t${type}\t${sourceSizeKb} -> ${compressedSizekb}\t${rate}%`)
}

export const compress = (options = {}) => {
  const gzip = options.gzip ?? true
  const brotli = options.brotli ?? true
  const gzipOpts = options.gzipOptions ?? {
    level: 9,
  }

  const brotliOpts = options.brotliOptions ?? {
    params: {
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
    },
  }
  const dirs = options.dirs ?? ['dist']

  if (brotli || gzip) {
    dirs.forEach(dir => {
      fs.readdirSync(dir).forEach(file => {
        // TODO: html?
        if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
          const filename = path.join(dir, file)
          const content = fs.readFileSync(filename)
          brotli && writeBrotliCompress(filename, content, brotliOpts)
          gzip && writeGzipCompress(filename, content, gzipOpts)
        }
      })
    })
  }
}
