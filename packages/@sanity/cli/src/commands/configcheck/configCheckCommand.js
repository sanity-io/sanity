import reinitializePluginConfigs from '../../util/reinitializePluginConfigs'

export default {
  name: 'configcheck',
  signature: 'configcheck',
  description: 'Checks if the required configuration files for plugins exists and are up to date',
  action: ({print, options}) => {
    return reinitializePluginConfigs({
      sanityDir: options.cwd,
      print: print
    })
  }
}
