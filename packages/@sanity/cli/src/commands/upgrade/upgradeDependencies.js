import path from 'path'
import fsp from 'fs-promise'
import semver from 'semver'
import {padStart} from 'lodash'
import readLocalManifest from '@sanity/util/lib/readLocalManifest'
import findSanityModuleVersions from '../../actions/versions/findSanityModuleVersions'
import {getFormatters} from '../versions/printVersionResult'

export default async (args, context) => {
  const {output, workDir, yarn, chalk} = context
  const {extOptions, argsWithoutOptions} = args
  const modules = argsWithoutOptions.slice()
  const {range, tag} = extOptions
  const targetRange = tag || range || 'latest'

  if (range && tag) {
    throw new Error('Both --tag and --range specified, can only use one')
  }

  if (range && !semver.validRange(range)) {
    throw new Error(`Invalid semver range "${range}"`)
  }

  // Find which modules needs update according to the target range
  const allNeedsUpdate = await getModulesInNeedOfUpdate(context, targetRange)

  const needsUpdate = modules.length === 0
    ? allNeedsUpdate
    : allNeedsUpdate.filter(outOfDate => modules.indexOf(outOfDate.name) !== -1)

  // If all modules are up-to-date, say so and exit
  if (needsUpdate.length === 0) {
    const specified = modules.length === 0 ? 'All' : 'All *specified*'
    context.output.print(`${chalk.green('✔')} ${specified} Sanity modules are at latest versions`)
    return
  }

  // Replace versions in `package.json`
  const oldManifest = await readLocalManifest(workDir)
  const newManifest = needsUpdate.reduce((target, mod) => {
    if (oldManifest.dependencies && oldManifest.dependencies[mod.name]) {
      target.dependencies[mod.name] = mod.latest === 'unknown'
        ? oldManifest.dependencies[mod.name]
        : `^${mod.latest}`
    }

    if (oldManifest.devDependencies && oldManifest.devDependencies[mod.name]) {
      target.devDependencies[mod.name] = mod.latest === 'unknown'
        ? oldManifest.devDependencies[mod.name]
        : `^${mod.latest}`
    }

    return target
  }, oldManifest)

  // Write new `package.json`
  const manifestPath = path.join(context.workDir, 'package.json')
  await fsp.writeJson(manifestPath, newManifest, {spaces: 2})

  // Delete `yarn.lock` to ensure we're getting new modules
  // (workaround, shouldnt be needed in the future)
  const yarnLockPath = path.join(context.workDir, 'yarn.lock')
  const hasLockFile = fsp.existsSync(yarnLockPath) // eslint-disable-line no-sync
  if (hasLockFile) {
    await fsp.unlink(yarnLockPath)
  }

  // Run `yarn install`
  const flags = extOptions.offline ? ['--offline'] : []
  const cmd = ['install'].concat(flags)
  await yarn(cmd, {...output, rootDir: workDir})

  context.output.print('')
  context.output.print(`${chalk.green('✔')} Modules upgraded:`)

  const {versionLength, formatName} = getFormatters(needsUpdate)
  needsUpdate.forEach(mod => {
    const current = chalk.yellow(padStart(mod.version, versionLength))
    const latest = chalk.green(mod.latest)
    context.output.print(`${formatName(mod.name)} ${current} → ${latest}`)
  })
}

async function getModulesInNeedOfUpdate(context, target) {
  const versions = await findSanityModuleVersions(context, target)
  return versions.filter(mod => mod.needsUpdate)
}
