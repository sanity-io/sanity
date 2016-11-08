import chalk from 'chalk'
import padEnd from 'lodash/padEnd'
import padStart from 'lodash/padStart'
import findSanityModuleVersions from '../../actions/versions/findSanityModuleVersions'

export default async (args, context) => {
  const versions = await findSanityModuleVersions(context)
  const {versionLength, formatName} = getFormatters(versions)

  versions.forEach(mod => {
    const version = padStart(mod.version, versionLength)
    const latest = mod.version === mod.latest
      ? chalk.green('(up to date)')
      : `(latest: ${chalk.yellow(mod.latest)})`
    context.output.print(`${formatName(mod.name)} ${version} ${latest}`)
  })
}

export function getFormatters(versions) {
  const nameLength = versions.reduce(longestProp('name'), 0)
  const versionLength = versions.reduce(longestProp('version'), 0)
  const formatName = name => padEnd(name, nameLength + 1).replace(
    /^@sanity\/(.*)/,
    `${chalk.yellow('@sanity/')}${chalk.cyan('$1')}`
  )

  return {nameLength, versionLength, formatName}
}

function longestProp(prop) {
  return (max, obj) => Math.max(max, obj[prop].length)
}
