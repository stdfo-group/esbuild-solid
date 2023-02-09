import { build } from 'esbuild'
import { prodconf } from '../config.mjs'

await build(prodconf)
