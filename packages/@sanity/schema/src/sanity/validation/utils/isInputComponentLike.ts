const REACT_SYM_RE = /^Symbol\(react\..+\)$/

export function isInputComponentLike(value: any) {
  const type = typeof value
  // Note: we're not using `isValidElementType` from react-is here since it accepts too much, e.g. any strings.
  return (
    type === 'function' ||
    (typeof value?.$$typeof === 'symbol' && REACT_SYM_RE.test(String(value?.$$typeof)))
  )
}
