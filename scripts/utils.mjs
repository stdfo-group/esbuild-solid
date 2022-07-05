export const perf = (label, func, ...opts) => {
  performance.mark(`${label}-start`)
  console.log(`${label} start`)
  const res = func(...opts)
  performance.mark(`${label}-end`)
  performance.measure(label, `${label}-start`, `${label}-end`)
  console.log(`${label} in ${perfMs(label)} ms`)
  return res
}

export const perfAsync = async (label, func, ...opts) => {
  performance.mark(`${label}-start`)
  console.log(`${label} start`)
  const res = await func(...opts)
  performance.mark(`${label}-end`)
  performance.measure(label, `${label}-start`, `${label}-end`)
  console.log(`${label} in ${perfMs(label)} ms`)
  return res
}

export const perfMs = label => performance.getEntriesByName(label)[0].duration.toFixed(3)
