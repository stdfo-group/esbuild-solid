import fs from 'node:fs'
import path from 'node:path'

const prepare = (meta, func, ..._opts) => {
  if (meta.label === undefined) {
    meta.label = func.name + '_' + (Date.now() % 100000)
  }
  performance.mark(`${meta.label}-start`)
  // console.log(`${meta.label} start`)
}

const finalize = (meta, _func, ..._opts) => {
  performance.mark(`${meta.label}-end`)
  performance.measure(meta.label, `${meta.label}-start`, `${meta.label}-end`)
  console.log(`${meta.label} end in ${perfMs(meta.label)} ms`)
}

export const perf = (label, func, ...opts) => {
  const meta = { label }
  prepare(meta, func, ...opts)
  const res = func(...opts)
  finalize(meta, func, ...opts)
  return res
}

export const perfAsync = async (label, func, ...opts) => {
  const meta = { label }
  prepare(meta, func, ...opts)
  const res = await func(...opts)
  finalize(meta, func, ...opts)
  return res
}

export const perfMs = label => performance.getEntriesByName(label)[0].duration.toFixed(3)

export const readdirSync = (p, a = []) => {
  if (fs.statSync(p).isDirectory()) fs.readdirSync(p).map(f => readdirSync(a[a.push(path.join(p, f)) - 1], a))
  return a
}
