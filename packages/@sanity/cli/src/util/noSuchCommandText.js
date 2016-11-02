const coreCommands = [
  'build',
  'check',
  'config',
  'dataset',
  'start',
  'install',
  'uninstall'
]

const helpText = `
Run the command again within a Sanity project directory, where "@sanity/core"
is installed as a dependency.`

export default cmd => {
  const isCoreCommand = coreCommands.indexOf(cmd) >= 0
  return isCoreCommand
    ? `"${cmd}" is not available outside of a Sanity project context.${helpText}`
    : `"${cmd}" is not a sanity command. See 'sanity --help'`
}
