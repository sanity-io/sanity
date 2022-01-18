import chalk from 'chalk'
import {padStart, padEnd} from 'lodash'
import findSanityModuleVersions from '../../actions/versions/findSanityModuleVersions'

export default async (args, context) => {
  printResult(await findSanityModuleVersions(context, {target: 'latest'}), context.output.print)
}

export function printResult(versions, print) {
  const {versionLength, formatName} = getFormatters(versions)
  versions.forEach((mod) => {
    const version = padStart(mod.installed || '<missing>', versionLength)
    const latest =
      mod.installed === mod.latest
        ? chalk.green('(up to date)')
        : `(latest: ${chalk.yellow(mod.latest)})`

    print(`${formatName(mod.name)} ${version} ${latest}`)
  })
}

export function getFormatters(versions) {
  const nameLength = versions.reduce((max, mod) => Math.max(max, mod.name.length), 0)
  const versionLength = versions.reduce(
    (max, mod) => Math.max(max, (mod.installed || '<missing>').length),
    0
  )

  const formatName = (name) =>
    padEnd(name, nameLength + 1).replace(
      /^@sanity\/(.*)/,
      `${chalk.yellow('@sanity/')}${chalk.cyan('$1')}`
    )

  return {nameLength, versionLength, formatName}
}
