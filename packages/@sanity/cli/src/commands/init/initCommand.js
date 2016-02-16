import gatherInput from './gatherInput'
import bootstrap from './bootstrap'
import npmInstall from '../../npm-bridge/install'

export default {
  name: 'init',
  signature: 'init [plugin]',
  description: 'Initialize a new Sanity project',
  action: args => {
    const type = args.options._[1]
    if (!type) {
      return initSanity(args)
    }

    if (type === 'plugin') {
      return initPlugin(args)
    }

    const error = new Error(`Unknown init type "${type}"`)
    args.error(error)
    return Promise.reject(error)
  }
}

function initSanity({print, prompt, error, options}) {
  print('This utility will walk you through creating a new Sanity installation.')
  print('It only covers the basic configuration, and tries to guess sensible defaults.\n')
  print('Press ^C at any time to quit.')

  return gatherInput(prompt, options)
    .then(answers => bootstrap(options.cwd, answers))
    .then(npmInstall)
    .then(() => print('Success!'))
    .catch(err => error(err))
}

function initPlugin() {
  return Promise.reject(new Error('Plugin initialization not yet implemented'))
}
