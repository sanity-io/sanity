import addPluginToManifest from '@sanity/util/lib/addPluginToManifest'
import getProjectDefaults from '../../util/getProjectDefaults'
import {bootstrapPlugin} from './bootstrap'
import gatherInput from './gatherInput'

export default async function initPlugin(args, context, initOpts = {}) {
  const {output, prompt, workDir} = context
  if (initOpts.sanityStyle) {
    output.print('[WARNING]: Bootstrapping with Sanity.io style guide')
  }

  output.print('This utility will walk you through creating a new Sanity plugin.')
  output.print('It only covers the basic configuration, and tries to guess sensible defaults.\n')
  output.print('Press ^C at any time to quit.\n')

  output.print(
    'If you intend to publish the plugin for reuse by others, it is '
    + 'recommended that the plugin name is prefixed with `sanity-plugin-`'
  )

  const pluginOpts = {isPlugin: true, workDir}
  const defaults = await getProjectDefaults(workDir, pluginOpts)
  const answers = await gatherInput(prompt, defaults, pluginOpts)
  const finalAnswers = {outputPath: workDir, ...answers}

  await bootstrapPlugin(finalAnswers, {output, ...initOpts})
  await addPluginOnUserConfirm(workDir, finalAnswers)

  output.print(`Success! Plugin initialized at ${finalAnswers.outputPath}`)
}

function addPluginOnUserConfirm(workDir, answers) {
  return answers.addPluginToManifest
    ? addPluginToManifest(workDir, answers.name.replace(/^sanity-plugin-/, ''))
    : Promise.resolve()
}
