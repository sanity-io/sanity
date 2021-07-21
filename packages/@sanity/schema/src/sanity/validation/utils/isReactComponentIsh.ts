const REACT_SYM_RE = /^Symbol\(react\..+\)$/

export function isReactComponentIsh(value: any) {
  const type = typeof value
  return (
    type === 'function' ||
    (typeof value?.$$typeof === 'symbol' && REACT_SYM_RE.test(String(value?.$$typeof)))
  )
}
