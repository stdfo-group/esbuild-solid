import { build } from 'esbuild'
import fs from 'node:fs'
import { outdir, prodconf } from '../config.mjs'
import { compress } from './compress.mjs'
import { perfAsync } from './utils.mjs'

let lastResult = null
const buildSteps = [
  [undefined, fs.promises.rm, outdir, { recursive: true, force: true }],
  [undefined, build, prodconf],
  [undefined, compress],
]

for (const stepParams of buildSteps) {
  lastResult = await perfAsync(...stepParams, lastResult)
}
