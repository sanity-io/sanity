import lazyRequire from '../../util/lazyRequire'

const help = `
Looks for a "package.json" and/or a "yarn.lock"-file in the current directory,
then installs or updates dependencies according to these files.

When working in the context of a project, this command transforms to allow
installation of Sanity-plugins as well.
`

export default {
  name: 'install',
  signature: '',
  description: 'Installs dependencies of the current project',
  action: lazyRequire(require.resolve('./installDependencies')),
  helpText: help
}
