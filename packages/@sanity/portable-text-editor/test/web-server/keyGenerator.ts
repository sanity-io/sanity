// Example of custom keyGenerator

const _createKeyGenerator = (prefix: string): (() => string) => {
  let key = 0
  const fn = (): string => {
    return `${prefix}-${key++}`
  }
  return fn
}

export const createKeyGenerator = _createKeyGenerator
