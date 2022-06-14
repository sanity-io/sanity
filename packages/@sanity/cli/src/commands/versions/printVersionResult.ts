import chalk from 'chalk'
import {padStart, padEnd} from 'lodash'
import {
  findSanityModuleVersions,
  ModuleVersionResult,
} from '../../actions/versions/findSanityModuleVersions'
import type {CliCommandAction} from '../../types'

const printVersionResultCommand: CliCommandAction = async (args, context) => {
  const versions = await findSanityModuleVersions(context, {target: 'latest'})
  printResult(versions, context.output.print)
}

export default printVersionResultCommand

export function printResult(versions: ModuleVersionResult[], print: (msg: string) => void): void {
  const {versionLength, formatName} = getFormatters(versions)
  versions.forEach((mod) => {
    const version = padStart(mod.installed || '<missing>', versionLength)
    const latest =
      mod.installed === mod.latest
        ? chalk.green('(up to date)')
        : `(latest: ${chalk.yellow(mod.latest)})`

    print(`${formatName(getDisplayName(mod))} ${version} ${latest}`)
  })
}

export function getFormatters(versions: ModuleVersionResult[]): {
  nameLength: number
  versionLength: number
  formatName: (name: string) => string
} {
  const nameLength = versions.reduce((max, mod) => Math.max(max, getDisplayName(mod).length), 0)
  const versionLength = versions.reduce(
    (max, mod) => Math.max(max, (mod.installed || '<missing>').length),
    0
  )

  const formatName = (name: string): string =>
    padEnd(name, nameLength + 1)
      .replace(/^@sanity\/(.*?)(\s|$)/, `${chalk.yellow('@sanity/')}${chalk.cyan('$1')}$2`)
      .replace(/^sanity(\s|$)/, `${chalk.yellow('sanity')}$1`)

  return {nameLength, versionLength, formatName}
}

function getDisplayName(mod: ModuleVersionResult): string {
  return mod.isGlobal ? `${mod.name} (global)` : mod.name
}
