export default function removeDuplicatePlugins(plugins) {
  const paths = []
  return plugins.filter(plugin => {
    if (paths.indexOf(plugin.path) !== -1) {
      return false
    }

    paths.push(plugin.path)
    return true
  })
}
