import fs from 'fs/promises'
import path from 'path'
import type {CliCommandContext, CliCommandArguments, SanityJson} from '../../types'
import type {InitFlags} from '../../commands/init/initCommand'
import {debug} from '../../debug'
import {bootstrapFromTemplate} from './bootstrapFromTemplate'
import {pluginTemplates} from './pluginTemplates'

export default async function initPlugin(
  args: CliCommandArguments<InitFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {output, prompt} = context
  const [, specifiedTemplateUrl] = args.argsWithoutOptions

  output.print('This utility will walk you through creating a new Sanity plugin.')
  output.print('Press ^C at any time to quit.\n')

  const hasTemplateUrl = /^https?:\/\//.test(specifiedTemplateUrl || '')

  if (hasTemplateUrl) {
    debug('User provided template URL: %s', specifiedTemplateUrl)
    return bootstrapFromUrl(context, specifiedTemplateUrl)
  }

  let specifiedTemplate = null
  if (specifiedTemplateUrl) {
    specifiedTemplate = pluginTemplates.find((tpl) => tpl.value === specifiedTemplateUrl)
  }

  if (specifiedTemplate) {
    debug(
      'User wanted template "%s", match found at %s',
      specifiedTemplateUrl,
      specifiedTemplate.url,
    )

    return bootstrapFromUrl(context, specifiedTemplate.url)
  } else if (specifiedTemplateUrl) {
    throw new Error(`Cannot find template with name "${specifiedTemplateUrl}"`)
  }

  const templateChoices = pluginTemplates.map(({value, name}) => ({value, name}))
  const selected = await prompt.single({
    message: 'Select template to use',
    type: 'list',
    choices: templateChoices,
  })

  specifiedTemplate = pluginTemplates.find((tpl) => tpl.value === selected)
  if (!specifiedTemplate) {
    throw new Error('No template selected')
  }

  debug('User selected template URL: %s', specifiedTemplate.url)
  return bootstrapFromUrl(context, specifiedTemplate.url)
}

async function bootstrapFromUrl(context: CliCommandContext, url: string): Promise<void> {
  const {output, prompt, yarn, workDir} = context

  debug('Bootstrapping from URL: %s', url)
  const {name, outputPath, inPluginsPath, dependencies} = await bootstrapFromTemplate(context, url)

  if (inPluginsPath) {
    const addIt = await prompt.single({
      type: 'confirm',
      message: 'Enable plugin in current Sanity installation?',
      default: true,
    })

    if (addIt) {
      await addPluginToManifest(workDir, name.replace(/^sanity-plugin-/, ''))
    }
  }

  if (dependencies) {
    const dependencyString = JSON.stringify(dependencies, null, 2)
      .split('\n')
      .slice(1, -1)
      .join('\n')
      .replace(/"/g, '')

    output.print('\nThe following dependencies are required for this template:')
    output.print(`${dependencyString}\n`)
  }

  if (dependencies && inPluginsPath) {
    const addDeps = await prompt.single({
      type: 'confirm',
      message: 'Install dependencies in current project?',
      default: true,
    })

    if (addDeps) {
      const deps = Object.keys(dependencies).map((dep) => `${dep}@${dependencies[dep]}`)
      await yarn(['add'].concat(deps), {...output, rootDir: workDir})

      output.print('Dependencies installed.')
      output.print('Remember to remove them from `package.json` if you no longer need them!')
    }
  }

  output.print(`\nSuccess! Plugin initialized at ${outputPath}`)
}

async function addPluginToManifest(sanityDir: string, pluginName: string): Promise<SanityJson> {
  const manifestPath = path.join(sanityDir, 'sanity.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))

  manifest.plugins = manifest.plugins || []
  if (manifest.plugins.indexOf(pluginName) === -1) {
    manifest.plugins.push(pluginName)
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  return manifest
}
