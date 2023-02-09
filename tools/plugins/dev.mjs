import { promises as fs } from 'node:fs'

export default function () {
  return {
    name: 'esbuild:dev',
    async setup(build) {
      build.onLoad(
        {
          filter: /index.html$/,
        },
        async args => {
          const contents = (await fs.readFile(args.path))
            .toString()
            .replace(
              '</body>',
              `<script>new EventSource('/esbuild').addEventListener('change', () => location.reload())</script></body>`
            )
          return {
            contents: contents,
            loader: 'copy',
          }
        }
      )
    },
  }
}
