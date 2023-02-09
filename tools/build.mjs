import { build } from 'esbuild'
import fs from 'node:fs'
import { outdir, prodconf } from '../config.mjs'
import { perfAsync } from './utils.mjs'

let lastResult = null
const buildSteps = [
  ['init', fs.promises.rm, outdir, { recursive: true, force: true }],
  [undefined, build, prodconf],
]

for (const stepParams of buildSteps) {
  lastResult = await perfAsync(...stepParams, lastResult)
}
