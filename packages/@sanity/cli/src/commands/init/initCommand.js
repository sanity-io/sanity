import gatherInput from './gatherInput'
import {bootstrapSanity, bootstrapPlugin} from './bootstrap'
import {install as npmInstall} from '../../npm-bridge/install'
import getProjectDefaults from '../../util/getProjectDefaults'

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

function initSanity({print, prompt, spinner, error, options}) {
  print('This utility will walk you through creating a new Sanity installation.')
  print('It only covers the basic configuration, and tries to guess sensible defaults.\n')
  print('Press ^C at any time to quit.')

  const spin = spinner('Installing dependencies...')

  return getProjectDefaults(options.cwd)
    .then(defaults => gatherInput(prompt, defaults))
    .then(answers => bootstrapSanity(options.cwd, answers))
    .then(() => spin.start())
    .then(() => npmInstall())
    .then(() => spin.stop())
    .then(() => print('Success! You can now run `sanity start`'))
    .catch(err => {
      spin.stop()
      error(err)
    })
}

function initPlugin({print, prompt, error, options}) {
  print('This utility will walk you through creating a new Sanity plugin.')
  print('It only covers the basic configuration, and tries to guess sensible defaults.\n')
  print('Press ^C at any time to quit.')

  return getProjectDefaults(options.cwd)
    .then(defaults => gatherInput(prompt, defaults, {isPlugin: true}))
    .then(answers => warnOnNonStandardPluginName(answers, print))
    .then(answers => bootstrapPlugin(options.cwd, answers))
    .then(() => print('Success!'))
    .catch(error)
}

function warnOnNonStandardPluginName(answers, print) {
  if (answers.name.indexOf('sanity-plugin-') !== 0) {
    print([
      '[Warning] If you intend to publish the plugin for reuse by others, ',
      'it is recommended that the plugin name is prefixed with `sanity-plugin-`'
    ].join(''))
  }

  return answers
}
