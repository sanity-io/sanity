import reinitializePluginConfigs from '../../actions/config/reinitializePluginConfigs'

export default {
  name: 'configcheck',
  command: 'configcheck',
  describe: 'Checks if the required configuration files for plugins exists and are up to date',
  handler: ({output, options}) => {
    return reinitializePluginConfigs({
      rootDir: options.rootDir,
      output: output
    })
  }
}
