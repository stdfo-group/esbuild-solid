import devPlugin from './tools/plugins/dev.mjs'
import statsPlugin from './tools/plugins/stats.mjs'
import compressPlugin from './tools/plugins/compress.mjs'
import solidPlugin from './tools/plugins/solid.mjs'
import { readdirSync } from './tools/utils.mjs'
import path from 'node:path'
export const outdir = './dist'
export const serveport = 3000
export const devport = 5000

function getEntryPoints() {
  const entries = [{ in: './src/index.tsx', out: 'index' }]
  const loaders = {}

  readdirSync('./public/').forEach(file => {
    const ext_name = path.extname(file)
    entries.push({ in: file, out: path.basename(file, ext_name) })
    loaders[ext_name] = 'copy'
  })

  return { entries, loaders }
}

const { entries, loaders } = getEntryPoints()

const baseconf = {
  entryPoints: entries,
  loader: loaders,
  bundle: true,
  color: true,
  plugins: [solidPlugin()],
}

export const devconf = {
  ...baseconf,
  outdir: './dist_dev',
  logLevel: 'debug',
  minify: false,
  plugins: [...baseconf.plugins, devPlugin()],
}

export const prodconf = {
  ...baseconf,
  outdir: outdir,
  minify: true,
  logLevel: 'info',
  metafile: true,
  plugins: [...baseconf.plugins, compressPlugin()],
}

export const statsconf = {
  ...prodconf,
  plugins: [...baseconf.plugins, statsPlugin(outdir)],
}
