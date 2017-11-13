import addPluginToManifest from '@sanity/util/lib/addPluginToManifest'
import bootstrapFromTemplate from '../../actions/init-plugin/bootstrapFromTemplate'
import pluginTemplates from './pluginTemplates'

export default async function initPlugin(args, context, initOpts = {}) {
  const {output, prompt} = context
  const [, specifiedTemplateUrl] = args.argsWithoutOptions

  output.print('This utility will walk you through creating a new Sanity plugin.')
  output.print('Press ^C at any time to quit.\n')

  const hasTemplateUrl = /^https?:\/\//.test(specifiedTemplateUrl || '')

  if (hasTemplateUrl) {
    return bootstrapFromUrl(context, specifiedTemplateUrl)
  }

  let specifiedTemplate = null
  if (specifiedTemplateUrl) {
    specifiedTemplate = pluginTemplates.find(tpl => tpl.value === specifiedTemplateUrl)
  }

  if (specifiedTemplate) {
    return bootstrapFromUrl(context, specifiedTemplate.url)
  } else if (specifiedTemplateUrl) {
    throw new Error(`Cannot find template with name "${specifiedTemplateUrl}"`)
  }

  const templateChoices = pluginTemplates.map(({value, name}) => ({value, name}))
  const selected = await prompt.single({
    message: 'Select template to use',
    type: 'list',
    choices: templateChoices
  })

  specifiedTemplate = pluginTemplates.find(tpl => tpl.value === selected)
  return bootstrapFromUrl(context, specifiedTemplate.url)
}

async function bootstrapFromUrl(context, url) {
  const {output, prompt, workDir} = context
  const {name, outputPath, inPluginsPath} = await bootstrapFromTemplate(context, url)

  if (inPluginsPath) {
    const addIt = await prompt.single({
      type: 'confirm',
      message: 'Enable plugin in current Sanity installation?',
      default: true
    })

    if (addIt) {
      await addPluginToManifest(workDir, name.replace(/^sanity-plugin-/, ''))
    }
  }

  output.print(`Success! Plugin initialized at ${outputPath}`)
}
