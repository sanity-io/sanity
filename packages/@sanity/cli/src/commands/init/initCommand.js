import gatherInput from './gatherInput'
import {bootstrapSanity, bootstrapPlugin} from './bootstrap'
import {install as npmInstall} from '../../npm-bridge/install'
import getProjectDefaults from '../../util/getProjectDefaults'
import addPluginToManifest from '../../util/addPluginToManifest'

export default {
  name: 'init',
  signature: 'init [plugin]',
  description: 'Initialize a new Sanity project',
  action: (args, opts) => {
    const type = args.options._[1]

    if (!type) {
      return initSanity(args)
    }

    if (type === 'plugin') {
      return initPlugin(args)
    }

    // Do not use this, unless you're really sure you know what you're doing
    if (type === 'blåbær') {
      return initPlugin(args, {sanityStyle: true})
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

  return getProjectDefaults(options.rootDir, options)
    .then(defaults => gatherInput(prompt, defaults))
    .then(answers => bootstrapSanity(options.rootDir, answers, print))
    .then(() => spin.start())
    .then(() => npmInstall())
    .then(() => spin.stop())
    .then(() => print('Success! You can now run `sanity start`'))
    .catch(err => {
      spin.stop()
      error(err)
    })
}

function initPlugin({print, prompt, error, options}, initOpts = {}) {
  if (initOpts.sanityStyle) {
    print('[WARNING]: Bootstrapping with Sanity.io style guide')
  }

  print('This utility will walk you through creating a new Sanity plugin.')
  print('It only covers the basic configuration, and tries to guess sensible defaults.\n')
  print('Press ^C at any time to quit.\n')

  print(
    'If you intend to publish the plugin for reuse by others, it is '
    + 'recommended that the plugin name is prefixed with `sanity-plugin-`'
  )

  const rootDir = options.rootDir
  return getProjectDefaults(rootDir, {isPlugin: true})
    .then(defaults => gatherInput(prompt, defaults, {isPlugin: true}))
    .then(answers => bootstrapPlugin(answers, {print, ...initOpts}))
    .then(answers => addPluginOnUserConfirm(rootDir, answers))
    .then(answers => print(`Success! Plugin initialized at ${answers.outputPath}`))
    .catch(error)
}

function addPluginOnUserConfirm(rootDir, answers) {
  if (!answers.addPluginToManifest) {
    return answers
  }

  return addPluginToManifest(
    rootDir,
    answers.name.replace(/^sanity-plugin-/, '')
  ).then(() => answers)
}
