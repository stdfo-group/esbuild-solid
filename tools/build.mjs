import { build } from 'esbuild'
import stats from 'esbuild-visualizer/dist/plugin/index.js'
import fs from 'node:fs'
import { outdir, prodconf, statsdir } from '../config.mjs'
import { compress } from './compress.mjs'
import { perfAsync } from './utils.mjs'

const init = async () => {
  await fs.promises.rm(outdir, { recursive: true, force: true })
  await fs.promises.rm(statsdir, { recursive: true, force: true })
}

const writeStats = async result => {
  const fileContent = await stats.visualizer(result.metafile)

  fs.mkdirSync(statsdir)
  fs.writeFileSync(`${statsdir}/stats.json`, JSON.stringify(result.metafile))
  fs.writeFileSync(`${statsdir}/stats.html`, fileContent)
}

let lastResult = null
const buildSteps = [
  [undefined, init],
  [undefined, build, prodconf],
  [undefined, writeStats],
  [undefined, compress],
]

for (const stepParams of buildSteps) {
  lastResult = await perfAsync(...stepParams, lastResult)
}
