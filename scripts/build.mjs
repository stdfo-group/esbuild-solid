import esbuild from 'esbuild'
import { solidPlugin } from 'esbuild-plugin-solid'
import { compress } from './compress.mjs'
import fs from 'fs'
import { exec } from 'child_process'

const startTime = performance.now()

const config = {
  entryPoints: ['./src/index.tsx'],
  bundle: true,
  outdir: './dist',
  minify: true,
  logLevel: 'info',
  metafile: true,
  plugins: [solidPlugin()],
}

fs.rmSync('./dist', { recursive: true, force: true })
fs.existsSync('./dist') || fs.mkdirSync('./dist')

const prepareTime = performance.now()
console.log(`Prepare in ${(prepareTime - startTime).toFixed(3)} ms`)

let result = await esbuild.build(config)

const buildTime = performance.now()
console.log(`Build in ${(buildTime - prepareTime).toFixed(3)} ms`)

fs.cpSync('./public/', './dist/', { recursive: true, force: true })
const staticTime = performance.now()
console.log(`Copy static in ${(staticTime - buildTime).toFixed(3)} ms`)

compress()
const compressTime = performance.now()
console.log(`Compress in ${(compressTime - staticTime).toFixed(3)} ms`)

const statsDir = './dist/stats'
fs.existsSync(statsDir) || fs.mkdirSync(statsDir)
fs.writeFileSync(`${statsDir}/meta.json`, JSON.stringify(result.metafile))
exec(`esbuild-visualizer --metadata ${statsDir}/meta.json --filename ${statsDir}/stats.html`, (err, stdout, stderr) => {
  if (err) {
    console.error(`esbuild-visualizer error: ${err}`)
    console.log(stderr)
    return
  }
  stdout && console.log(stdout)
  const statsTime = performance.now()
  console.log(`Stats in ${(statsTime - compressTime).toFixed(3)} ms`)
})
