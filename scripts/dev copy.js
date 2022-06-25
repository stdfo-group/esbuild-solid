const esbuild = require('esbuild')

const { solidPlugin } = require('esbuild-plugin-solid')
const { compress } = require('esbuild-plugin-compress')
const { cp } = require('fs/promises')
const fs = require('fs')
const { exec } = require('child_process')
fs.rmSync('./dist', { recursive: true, force: true })

esbuild
  .build({
    entryPoints: ['./src/index.tsx'],
    bundle: true,
    sourcemap: true,
    outdir: './www/',
    minify: false,
    logLevel: 'info',
    metafile: false,
    write: false,
    plugins: [solidPlugin()],
  })
  .catch(e => {
    console.log(e)
    process.exit(1)
  })
