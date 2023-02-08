import { solidPlugin, statsPlugin } from './tools/esbuild_plugins.mjs'

export const outdir = './dist'
export const serveport = 3000

export const statsdir = './stats'

export const devport = 5000
export const devoutdir = './dist_dev'

const baseconf = {
  entryPoints: [
    { in: './src/index.tsx', out: 'index' },
    { in: './public/index.html', out: 'index' },
    { in: './public/favicon.ico', out: 'favicon' },
  ],
  loader: {
    '.html': 'copy',
    '.ico': 'copy',
  },
  bundle: true,
  plugins: [solidPlugin()],
}

export const devconf = {
  ...baseconf,
  outdir: devoutdir,
  minify: false,
}

export const prodconf = {
  ...baseconf,
  outdir: outdir,
  minify: true,
  logLevel: 'info',
  metafile: true,
  plugins: [...baseconf.plugins, statsPlugin(statsdir)],
}
