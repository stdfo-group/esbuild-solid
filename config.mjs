import { devPlugin, solidPlugin, statsPlugin } from './tools/esbuild_plugins.mjs'

export const outdir = './dist'
export const serveport = 3000

export const devport = 5000
export const devoutdir = './dist_dev'

const entryPoints = [
  { in: './src/index.tsx', out: 'index' },
  { in: './public/index.html', out: 'index' },
  { in: './public/favicon.ico', out: 'favicon' },
]

const baseconf = {
  entryPoints: entryPoints,
  loader: {
    '.html': 'copy',
    '.ico': 'copy',
  },
  bundle: true,
  color: true,
  plugins: [solidPlugin()],
}

export const devconf = {
  ...baseconf,
  outdir: devoutdir,
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
  plugins: [...baseconf.plugins, statsPlugin('./stats')],
}
