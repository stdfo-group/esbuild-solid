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

perf('prepare', () => {
  fs.rmSync(outdir, { recursive: true, force: true })
  fs.existsSync(outdir) || fs.mkdirSync(outdir)
})

let result = await perfAsync('build', esbuild.build, config)

perf('static', () => fs.cpSync('./public/', outdir, { recursive: true, force: true }))
perf('compress', compress)

await perfAsync('stats', async () => {
  const fileContent = await stats.visualizer(result.metafile)
  fs.writeFileSync(`${outdir}/stats.html`, fileContent)
})
