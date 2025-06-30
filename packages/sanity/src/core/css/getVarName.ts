const RE_CSS_VAR = /^var\((.*)\)$/

export function getVarName(variable: `var(--${string})`): `--${string}` {
  const matches = variable.match(RE_CSS_VAR)

  if (matches) {
    return matches[1] as `--${string}`
  }

  return variable as `--${string}`
}
