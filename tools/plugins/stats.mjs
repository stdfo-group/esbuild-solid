import stats from 'esbuild-visualizer/dist/plugin/index.js'
import { existsSync, promises as fs } from 'node:fs'
import path from 'node:path'

export default function (statsdir = './stats', json_out = false, html_out = true) {
  const pluginName = 'esbuild:stats'
  return {
    name: pluginName,
    async setup(build) {
      if (!build.initialOptions.metafile) {
        throw 'metafile not enabled'
      }

      build.onEnd(async result => {
        const metafile = result.metafile
        if ((html_out || json_out) && !existsSync(statsdir)) {
          await fs.mkdir(statsdir)
        }
        if (json_out) {
          const json_out_path = path.join(statsdir, 'stats.json')
          fs.writeFile(json_out_path, JSON.stringify(metafile, null, 4)).then(_ => console.log(json_out_path))
        }
        if (html_out) {
          const html_out_path = path.join(statsdir, 'stats.html')
          stats
            .visualizer(metafile)
            .then(content => fs.writeFile(html_out_path, content))
            .then(_ => console.log(html_out_path))
        }
      })
    },
  }
}
