function flattenTree(target, plugin, index) {
  if (!plugin.plugins || plugin.plugins.length === 0) {
    return target
  }

  const children = plugin.plugins.reduce(flattenTree, plugin.plugins)

  // Clone the target (because mutation is bad, right?)
  const newTarget = target.slice()

  // Add all the plugins that this plugin depend on,
  // before the current plugin in the chain
  Array.prototype.splice.apply(
    newTarget,
    [target.indexOf(plugin), 0].concat(children)
  )

  return newTarget
}

export default flattenTree
