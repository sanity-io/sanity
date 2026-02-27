import {type CliOutputter} from '../types'

export interface RuntimeCliCommand {
  getHelpText(bin: string, commandId: string): string
  summary: string
}

// oxlint-disable-next-line no-control-regex -- yes, the ANSI escape regex contains control characters
const ANSI_REGEX = /\x1b\[[0-9;]*m/g
const OCLIF_HEADERS = [
  'ARGUMENTS',
  'FLAGS',
  'GLOBAL FLAGS',
  'FLAG DESCRIPTIONS',
  'DESCRIPTION',
  'EXAMPLES',
  'ALIASES',
  'COMMANDS',
  'TOPICS',
  'CONFIGURATION VARIABLES',
]

function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '')
}

function transformHelpLine(line: string): string {
  const cleanLine = stripAnsi(line)
  if (OCLIF_HEADERS.includes(cleanLine)) {
    return `${cleanLine.toLowerCase()}:`
  }
  return cleanLine
}

/**
 * Transforms the help text of a runtime CLI command into an object usable by the CLI.
 * @param command - The command to transform the help text for.
 * @param bin - The binary name of the command.
 * @param commandId - The ID of the command, e.g. "blueprints deploy".
 * @returns An object containing the transformed help text, signature, and description.
 */
export function transformHelpText(
  command: RuntimeCliCommand,
  bin: string,
  commandId: string,
): {helpText: string; signature: string; description: string} {
  const fullHelpText = command.getHelpText(bin, commandId)
  const lines = fullHelpText.split('\n')
  const usagePrefix = `  $ ${bin} ${commandId} `

  let usageStartIndex = -1
  let usageEndIndex = -1
  const signatureParts: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const cleanLine = stripAnsi(lines[i])

    if (cleanLine === 'USAGE') {
      usageStartIndex = i
      continue
    }

    if (usageStartIndex !== -1 && usageEndIndex === -1) {
      if (cleanLine.startsWith(usagePrefix)) {
        signatureParts.push(cleanLine.slice(usagePrefix.length).trim())
      } else if (signatureParts.length > 0 && cleanLine.startsWith('    ')) {
        signatureParts.push(cleanLine.trim())
      } else if (cleanLine === '' || /^[A-Z]+$/.test(cleanLine)) {
        usageEndIndex = i
      }
    }
  }

  const signature = signatureParts.join(' ')

  const helpTextLines: string[] = []
  for (let i = 0; i < lines.length; i++) {
    if (usageStartIndex !== -1 && i >= usageStartIndex && i < usageEndIndex) continue
    if (i === usageEndIndex && stripAnsi(lines[i]) === '') continue
    helpTextLines.push(transformHelpLine(lines[i]))
  }

  return {
    helpText: helpTextLines.join('\n'),
    signature,
    description: command.summary,
  }
}
/**
 * The Functions Test Core expects the "error" function to be oclif's Command.error function.
 * This custom error logger mimics the shapes used by the core.
 */
export function createErrorLogger(output: CliOutputter) {
  return (message: string, options: {exit?: boolean; code?: number} = {}) => {
    output.error(message) // does not exit, only prints with error prefix
    if (options.exit) process.exit(options.code ?? 1) // exit if the core wants to exit
  }
}
