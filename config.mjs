import devPlugin from './tools/plugins/dev.mjs'
import statsPlugin from './tools/plugins/stats.mjs'
import compressPlugin from './tools/plugins/compress.mjs'
import solidPlugin from './tools/plugins/solid.mjs'

export const outdir = './dist'
export const serveport = 3000
export const devport = 5000

const entryPoints = [
  { in: './src/index.tsx', out: 'index' },
  { in: './public/index.html', out: 'index' },
  { in: './public/favicon.png', out: 'favicon' },
]

const baseconf = {
  entryPoints: entryPoints,
  loader: {
    '.html': 'copy',
    '.ico': 'copy',
    '.png': 'copy',
  },
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
