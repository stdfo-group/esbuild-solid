import esbuild from 'esbuild'
import { solidPlugin } from 'esbuild-plugin-solid'
import compress from './compress.mjs'
import fs from 'fs'
import stats from 'esbuild-visualizer/dist/plugin/index.js'
import { perf, perfAsync } from './utils.mjs'

const outdir = './dist'
const config = {
  entryPoints: ['./src/index.tsx'],
  bundle: true,
  outdir: outdir,
  minify: true,
  logLevel: 'info',
  metafile: true,
  plugins: [solidPlugin()],
}

perf('init', () => {
  fs.rmSync(outdir, { recursive: true, force: true })
  fs.cpSync('./public/', outdir, { recursive: true, force: true })
})

let result = await perfAsync('build', esbuild.build, config)
perf('compress', compress)

await perfAsync('stats', async () => {
  const fileContent = await stats.visualizer(result.metafile)
  fs.mkdirSync(`${outdir}/stats`)
  fs.writeFileSync(`${outdir}/stats/stats.json`, JSON.stringify(result.metafile))
  fs.writeFileSync(`${outdir}/stats/stats.html`, fileContent)
})
