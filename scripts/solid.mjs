import { transformFileAsync } from '@babel/core'
import solid from 'babel-preset-solid'
import ts from '@babel/preset-typescript'

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
