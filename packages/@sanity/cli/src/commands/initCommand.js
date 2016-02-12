import validateNpmPackageName from 'validate-npm-package-name'
import isGitUrl from 'is-git-url'

export default {
  name: 'init',
  signature: 'init [plugin]',
  description: 'Initialize a new Sanity project',
  action: args => {
    const type = args.options._[1]
    if (!type) {
      return init(args)
    }

    if (type === 'plugin') {
      initPlugin(args)
    }

    return args.error(new Error(`Unknown init type "${type}"`))
  }
}

function init({print, prompt, error, options}) {
  print('This utility will walk you through creating a new Sanity installation.')
  print('It only covers the basic configuration, and tries to guess sensible defaults.\n')
  print('Press ^C at any time to quit.')

  prompt([{
    type: 'input',
    name: 'name',
    message: 'Project name:',
    default: options.defaults.projectName || '',
    validate: name => {
      const {validForNewPackages, errors} = validateNpmPackageName(name)
      return validForNewPackages ? true : errors[0]
    }
  }, {
    type: 'input',
    name: 'description',
    message: 'Project description:',
    default: options.defaults.description,
    validate: description => (
      (description || '').length < 1000
      || 'Project descriptions should be less than 1000 characters'
    )
  }, {
    type: 'input',
    name: 'gitRemote',
    message: 'Git repository URL:',
    default: options.defaults.gitRemote,
    validate: url => {
      return (url ? isGitUrl(url) : true) || 'Invalid git url'
    }
  }, {
    type: 'input',
    name: 'author',
    message: 'Author:',
    default: options.defaults.author
  }])
}

function initPlugin() {
  throw new Error('Plugin initialization not yet implemented')
}
