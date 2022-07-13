import { build } from 'esbuild'
import { solidPlugin } from './solid.mjs'
import { compress } from './compress.mjs'
import fs from 'fs'
import stats from 'esbuild-visualizer/dist/plugin/index.js'
import { perfAsync } from './utils.mjs'

const outdir = './dist'
const config = {
  entryPoints: ['./src/index.tsx'],
  bundle: true,
  outdir: outdir,
  minify: true,
  logLevel: 'info',
  metafile: true,
  plugins: [solidPlugin()],
}

const init = () =>
  new Promise(resolve => {
    fs.rmSync(outdir, { recursive: true, force: true })
    fs.cpSync('./public/', outdir, { recursive: true, force: true })

    resolve()
  })

const writeStats = async result => {
  const fileContent = await stats.visualizer(result.metafile)

  fs.mkdirSync(`${outdir}/stats`)
  fs.writeFileSync(`${outdir}/stats/stats.json`, JSON.stringify(result.metafile))
  fs.writeFileSync(`${outdir}/stats/stats.html`, fileContent)
}

let lastResult = null
const buildSteps = [
  [undefined, init],
  [undefined, build, config],
  [undefined, writeStats],
  [undefined, compress],
]

for (const stepParams of buildSteps) {
  lastResult = await perfAsync(...stepParams, lastResult)
}
