import esbuild from 'esbuild'
import { solidPlugin } from 'esbuild-plugin-solid'
import { compress } from 'esbuild-plugin-compress'
import fs from 'fs'
import { exec } from 'child_process'

const config = {
  entryPoints: ['./src/index.tsx'],
  bundle: true,
  outdir: './dist',
  minify: true,
  logLevel: 'info',
  metafile: true,
  write: false,
  plugins: [
    solidPlugin(),
    compress({
      gzip: true,
      brotli: true,
    }),
  ],
}

fs.rmSync('./dist', { recursive: true, force: true })
fs.existsSync('./dist') || fs.mkdirSync('./dist')

let result = await esbuild.build(config)
fs.cpSync('./public/', './dist/', { recursive: true, force: true })

const statsDir = './dist/stats'
fs.existsSync(statsDir) || fs.mkdirSync(statsDir)
fs.writeFileSync(`${statsDir}/meta.json`, JSON.stringify(result.metafile))
exec(`esbuild-visualizer --metadata ${statsDir}/meta.json --filename ${statsDir}/stats.html`, (err, stdout, stderr) => {
  if (err) {
    console.error(`esbuild-visualizer error: ${err}`)
    console.log(stderr)
    return
  }

  console.log(`${stdout}`)
})
