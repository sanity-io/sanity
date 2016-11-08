import path from 'path'
import fsp from 'fs-promise'
import padStart from 'lodash/padStart'
import readLocalManifest from '@sanity/util/lib/readLocalManifest'
import findSanityModuleVersions from '../../actions/versions/findSanityModuleVersions'
import {getFormatters} from '../versions/printVersionResult'

// @todo upgrade only to given semver range
export default async (args, context) => {
  const {output, workDir, yarn, chalk} = context
  const {extOptions, argsWithoutOptions} = args
  const modules = argsWithoutOptions.slice()

  const allOutdated = await getOutdatedModules(context)
  const outdated = modules.length === 0
    ? allOutdated
    : allOutdated.filter(outOfDate => modules.indexOf(outOfDate.name) !== -1)

  if (outdated.length === 0) {
    const specified = modules.length === 0 ? 'All' : 'All *specified*'
    context.output.print(`${chalk.green('✔')} ${specified} Sanity modules are at latest versions`)
    return
  }

  const oldManifest = await readLocalManifest(workDir)

  const newManifest = outdated.reduce((target, mod) => {
    if (oldManifest.dependencies && oldManifest.dependencies[mod.name]) {
      target.dependencies[mod.name] = `^${mod.latest}`
    }

    if (oldManifest.devDependencies && oldManifest.devDependencies[mod.name]) {
      target.devDependencies[mod.name] = `^${mod.latest}`
    }

    return target
  }, oldManifest)

  const manifestPath = path.join(context.workDir, 'package.json')
  await fsp.writeJson(manifestPath, newManifest, {spaces: 2})

  const flags = extOptions.offline ? ['--offline'] : []
  const cmd = ['install'].concat(flags)
  await yarn(cmd, {...output, rootDir: workDir})

  context.output.print('')
  context.output.print(`${chalk.green('✔')} Modules upgraded:`)

  const {versionLength, formatName} = getFormatters(outdated)
  outdated.forEach(mod => {
    const current = chalk.yellow(padStart(mod.version, versionLength))
    const latest = chalk.green(mod.latest)
    context.output.print(`${formatName(mod.name)} ${current} → ${latest}`)
  })
}

async function getOutdatedModules(context) {
  const versions = await findSanityModuleVersions(context)
  return versions.filter(mod => mod.isOutdated)
}
