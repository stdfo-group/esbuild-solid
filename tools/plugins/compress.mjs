import { promises as fs, statSync } from 'node:fs'
import zlib from 'node:zlib'

export default function (options = {}) {
  const pluginName = 'esbuild:compress'
  return {
    name: pluginName,
    async setup(build) {
      if (!build.initialOptions.metafile) {
        throw 'metafile not enabled'
      }
      const minSize = options.minSize ?? 4096
      const gzip = options.gzip ?? true
      const brotli = options.brotli ?? true
      const gzipOpts = options.gzipOptions ?? {
        level: zlib.constants.Z_BEST_COMPRESSION,
      }
      const brotliOpts = options.brotliOptions ?? {
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
        },
      }

      const logDelta = (sourcePath, compressedPath) => {
        const sourceSize = statSync(sourcePath).size
        const compressedSize = statSync(compressedPath).size
        const rate = ((compressedSize / sourceSize) * 100).toFixed(2)
        const sourceSizeKb = (sourceSize / 1024).toFixed(2)
        const compressedSizekb = (compressedSize / 1024).toFixed(2)
        console.log(`${sourcePath} -> ${compressedPath}\t${sourceSizeKb} -> ${compressedSizekb}\t\t${rate}%`)
      }

      build.onEnd(result => {
        const outputs = Object.keys(result.metafile.outputs)
        outputs
          .filter(i => i.endsWith('.js') || i.endsWith('.css') || i.endsWith('.html'))
          .filter(i => statSync(i).size > minSize)
          .forEach(file =>
            fs.readFile(file).then(content => {
              brotli &&
                zlib.brotliCompress(content, brotliOpts, function (_, res) {
                  fs.writeFile(`${file}.br`, res).then(() => logDelta(file, `${file}.br`))
                })
              gzip &&
                zlib.gzip(content, gzipOpts, function (_, res) {
                  fs.writeFile(`${file}.gz`, res).then(() => logDelta(file, `${file}.gz`))
                })
            })
          )
      })
    },
  }
}
