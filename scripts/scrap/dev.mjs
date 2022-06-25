import esbuild from 'esbuild'
import { solidPlugin } from 'esbuild-plugin-solid'
import { htmlPlugin } from '@craftamap/esbuild-plugin-html'
import { compress } from 'esbuild-plugin-compress'
import fs from 'fs'
import { exec } from 'child_process'

esbuild.serve(
  {
    servedir: 'dist',
    port: 3000,
  },
  {
    entryPoints: ['src/index.tsx'],
    outdir: 'dist',
    bundle: true,
    sourcemap: 'both',
    minify: false,
    metafile: true,
    plugins: [
      solidPlugin(),
      htmlPlugin({
        files: [
          {
            entryPoints: ['src/index.tsx'],
            filename: 'index.html',
            htmlTemplate: './public/index.html',
            findRelatedOutputFiles: false,
            title: 'Test App',
            scriptLoading: 'module',
            favicon: './public/favicon.ico',
          },
        ],
      }),
    ],
  }
)
// .then(server => {
//   // Call "stop" on the web server to stop serving
//   server.stop()
// }).catch(err => console.error(err))
