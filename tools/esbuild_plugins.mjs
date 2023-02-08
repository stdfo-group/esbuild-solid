import { transformFileAsync } from '@babel/core'
import solid from 'babel-preset-solid'
import ts from '@babel/preset-typescript'
import stats from 'esbuild-visualizer/dist/plugin/index.js'
import { promises as fs } from 'node:fs'

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
          console.log(`metafile not enabled`)
          return
        }
        if (html_out || json_out) {
          await fs.mkdir(statsdir)
        }
        if (json_out) {
          await fs.writeFile(`${statsdir}/stats.json`, JSON.stringify(result.metafile))
        }
        if (html_out) {
          const fileContent = await stats.visualizer(result.metafile)
          await fs.writeFile(`${statsdir}/stats.html`, fileContent)
        }
      })
    },
  }
}
