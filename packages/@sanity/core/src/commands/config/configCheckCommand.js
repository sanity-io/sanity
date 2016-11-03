import reinitializePluginConfigs from '../../actions/config/reinitializePluginConfigs'

export default {
  name: 'configcheck',
  signature: '',
  description: 'Checks if the required configuration files for plugins exists and are up to date',
  action: (args, context) => reinitializePluginConfigs(context)
}
