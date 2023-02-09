import { transformFileAsync } from '@babel/core'
import ts from '@babel/preset-typescript'
import solid from 'babel-preset-solid'

export default function (options) {
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
