import reinitializePluginConfigs from '../../actions/config/reinitializePluginConfigs'

export default {
  name: 'configcheck',
  signature: 'configcheck',
  description: 'Checks if the required configuration files for plugins exists and are up to date',
  action: ({print, options}) => {
    return reinitializePluginConfigs({
      rootDir: options.rootDir,
      print: print
    })
  }
}
