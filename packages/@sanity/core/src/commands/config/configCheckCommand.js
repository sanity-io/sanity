export default {
  name: 'configcheck',
  signature: '',
  description: 'Checks if the required configuration files for plugins exists and are up to date',
  hideFromHelp: true,
  action: (args, context) =>
    context.output.error('`sanity configcheck` is no longer required/used'),
}
