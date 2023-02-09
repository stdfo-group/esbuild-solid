import { build } from 'esbuild'
import { statsconf } from '../config.mjs'

await build(statsconf)
