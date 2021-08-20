export function pluginCanonicalModules(names: string[]) {
  return {
    name: 'canonical-modules',

    resolveId(id: string) {
      if (names.includes(id)) {
        return require.resolve(id)
      }

      return undefined
    },
  }
}
