export function getData(metadata, cssCustomProperties) {
  const used = []
  const unused = []
  const unknown = []

  const groups = metadata.groups.map((group) => {
    return {
      name: group.name,
      properties: group.properties.map((item) => {
        const val = cssCustomProperties[item.name]

        used.push(item.name)

        if (val === undefined) {
          unknown.push(item.name)
        }

        return {
          type: item.type,
          name: item.name,
          value: val,
        }
      }),
    }
  })

  groups.sort((a, b) => {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    return 0
  })

  Object.keys(cssCustomProperties).forEach((key) => {
    if (!used.includes(key)) {
      unused.push(key)
    }
  })

  return {
    groups,
    unknown,
    unused,
  }
}
