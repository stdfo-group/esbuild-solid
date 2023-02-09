import { promises as fs } from 'node:fs'

export default function (dirs = ['./dist']) {
  return {
    name: 'esbuild:clean',
    async setup(build) {
      build.onStart(() => {
        dirs.forEach(dir => {
          fs.rm(dir, { recursive: true, force: true }).then(() => console.log(`Removed ${dir}`))
        })

        console.log('build started')
      })
    },
  }
}
