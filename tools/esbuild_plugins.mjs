import { transformFileAsync } from '@babel/core'
import ts from '@babel/preset-typescript'
import solid from 'babel-preset-solid'
import stats from 'esbuild-visualizer/dist/plugin/index.js'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export function solidPlugin(options) {
  const presets = [[solid, options], ts]

  return {
    name: 'esbuild:solid',

    setup(build) {
      build.onLoad({ filter: /\.(t|j)sx$/ }, async args => {
        const { code } = await transformFileAsync(args.path, { presets: presets })

        return { contents: code, loader: 'js' }
      })
    },
  }
}

export function statsPlugin(statsdir = './stats', json_out = false, html_out = true) {
  return {
    name: 'esbuild:stats',
    async setup(build) {
      await fs.rm(statsdir, { recursive: true, force: true })
      build.onEnd(async result => {
        if (!build.initialOptions.metafile) {
          throw 'metafile not enabled'
        }

        const metafile = result.metafile
        const any_out = html_out || json_out
        any_out && (await fs.mkdir(statsdir))
        json_out && (await fs.writeFile(path.join(statsdir, 'stats.json'), JSON.stringify(metafile)))
        html_out && (await fs.writeFile(path.join(statsdir, 'stats.json'), await stats.visualizer(metafile)))
      })
    },
  }
}

export function devPlugin() {
  return {
    name: 'esbuild:dev',
    async setup(build) {
      build.onLoad(
        {
          filter: /index.html$/,
        },
        async args => {
          if (!build.initialOptions.outdir) {
            throw 'outdir not set'
          }

          const source = await fs.readFile(args.path)
          const patched = source
            .toString()
            .replace(
              '</body>',
              `<script>new EventSource('/esbuild').addEventListener('change', () => location.reload())</script></body>`
            )
          return {
            contents: patched,
            loader: 'copy',
          }
        }
      )
    },
  }
}
