function assignDefinitions(definitions, plugin) {
  (plugin.manifest.roles || []).forEach(role => {
    if (!role.name) {
      return
    }

    const existingDefinition = definitions[role.name]
    if (existingDefinition) {
      const existing = `"${existingDefinition.plugin}" (${existingDefinition.path})`
      const current = `"${plugin.name}" (${plugin.path})`
      const base = `Plugins ${existing} and ${current} both provide "${role.name}"`
      const help = 'did you mean to use "implements"?'
      throw new Error(`${base} - ${help}`)
    }

    definitions[role.name] = {
      plugin: plugin.name,
      path: plugin.path,
      description: role.description,
      isAbstract: typeof role.path === 'undefined'
    }
  })

  return definitions
}

export default assignDefinitions
