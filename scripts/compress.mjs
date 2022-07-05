import fs from 'fs'
import path from 'path'
import zlib, { gzipSync, brotliCompressSync } from 'zlib'
import { perf } from './utils.mjs'

const writeGzipCompress = (path, contents, options = {}) => {
  const filename = `${path}.gz`
  fs.writeFileSync(filename, gzipSync(contents, options))
  logDelta(path, filename, 'gzip')
}

const writeBrotliCompress = (path, contents, options = {}) => {
  const filename = `${path}.br`
  fs.writeFileSync(filename, brotliCompressSync(contents, options))
  logDelta(path, filename, 'brotli')
}

const logDelta = (sourcePath, compressedPath, type) => {
  const sourceSize = fs.statSync(sourcePath).size
  const sourceSizeKb = Math.round(sourceSize * 0.1) / 100
  const compressedSize = fs.statSync(compressedPath).size
  const compressedSizekb = Math.round(compressedSize * 0.1) / 100
  const rate = ((compressedSize / sourceSize) * 100).toFixed(2)
  console.log(`${sourcePath}\t${type}\t${sourceSizeKb} -> ${compressedSizekb}\t${rate}%`)
}

export default (options = {}) => {
  const dirs = options.dirs ?? ['dist']
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

  if (brotli || gzip) {
    dirs.forEach(dir => {
      fs.readdirSync(dir)
        // TODO: html?
        .filter(i => i.endsWith('.js') || i.endsWith('.css') || i.endsWith('.html'))
        .forEach(file => {
          perf('  ' + file, () => {
            const filename = path.join(dir, file)
            const content = fs.readFileSync(filename)
            brotli && writeBrotliCompress(filename, content, brotliOpts)
            gzip && writeGzipCompress(filename, content, gzipOpts)
          })
        })
    })
  }
}
