import * as esbuild from 'esbuild'
import { promises as fs } from 'node:fs'
import { devconf, devoutdir, devport } from '../config.mjs'

// eslint-disable-next-line no-undef
const proc = process
const onExit = _signal => {
  ctx.dispose()
  fs.rm(devoutdir, { recursive: true, force: true }).then(() => {
    console.log('Bye!')
    proc.exit()
  })
}
proc.on('SIGINT', onExit)
proc.on('SIGTERM', onExit)
proc.on('exit', onExit)

const ctx = await esbuild.context(devconf)
await ctx.serve({
  servedir: devoutdir,
  port: devport,
  onRequest(args) {
    console.log(`%s %d %s %s\t%d ms`, args.remoteAddress, args.status, args.method, args.path, args.timeInMS)
  },
})
await ctx.watch()
