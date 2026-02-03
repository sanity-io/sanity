import {describe, expect, it, vi} from 'vitest'

import {type CliOutputter} from '../types'
import {
  createErrorLogger,
  type RuntimeCliCommand,
  transformHelpText,
} from '../util/runtimeCommandHelp'

function createMockCommand(helpText: string, summary: string): RuntimeCliCommand {
  return {
    getHelpText: () => helpText,
    summary,
  }
}

describe('transformHelpText', () => {
  it('extracts signature from single-line USAGE', () => {
    const helpText = `USAGE
  $ sanity blueprints config [--project-id <value>] [--edit]

FLAGS
  --project-id=<value>  Project ID
  --edit                Edit mode

DESCRIPTION
  Configure blueprints`

    const command = createMockCommand(helpText, 'Configure blueprints')
    const result = transformHelpText(command, 'sanity', 'blueprints config')

    expect(result.signature).toBe('[--project-id <value>] [--edit]')
    expect(result.description).toBe('Configure blueprints')
    expect(result.helpText).not.toContain('USAGE')
    expect(result.helpText).toContain('flags:')
  })

  it('extracts signature from multi-line USAGE', () => {
    const helpText = `USAGE
  $ sanity blueprints add TYPE [--example <value> | -n <value> | --fn-type
    document-create|document-delete|document-update|document-publish | --language
    ts|js | --javascript]

FLAGS
  -n, --name=<value>  Name of the resource

DESCRIPTION
  Add a resource`

    const command = createMockCommand(helpText, 'Add a resource')
    const result = transformHelpText(command, 'sanity', 'blueprints add')

    expect(result.signature).toBe(
      'TYPE [--example <value> | -n <value> | --fn-type document-create|document-delete|document-update|document-publish | --language ts|js | --javascript]',
    )
    expect(result.description).toBe('Add a resource')
    expect(result.helpText).not.toContain('USAGE')
  })

  it('strips ANSI escape codes and transforms headers', () => {
    const helpText = `\x1b[1mUSAGE\x1b[22m
  $ sanity blueprints config [--edit]

\x1b[1mFLAGS\x1b[22m
  --edit  Edit mode`

    const command = createMockCommand(helpText, 'Configure')
    const result = transformHelpText(command, 'sanity', 'blueprints config')

    expect(result.signature).toBe('[--edit]')
    expect(result.helpText).not.toContain('USAGE')
    expect(result.helpText).not.toContain('\x1b[')
    expect(result.helpText).toContain('flags:')
    expect(result.helpText).not.toContain('FLAGS')
  })

  it('handles USAGE with no signature (command only)', () => {
    const helpText = `USAGE
  $ sanity blueprints info

FLAGS
  --verbose  Verbose output`

    const command = createMockCommand(helpText, 'Show info')
    const result = transformHelpText(command, 'sanity', 'blueprints info')

    expect(result.signature).toBe('')
    expect(result.description).toBe('Show info')
  })

  it('transforms all oclif headers to lowercase with colon', () => {
    const helpText = `USAGE
  $ sanity blueprints deploy [--no-wait]

ARGUMENTS
  NAME  The name

FLAGS
  --no-wait  Do not wait

DESCRIPTION
  Deploy a blueprint

EXAMPLES
  $ sanity blueprints deploy`

    const command = createMockCommand(helpText, 'Deploy a blueprint')
    const result = transformHelpText(command, 'sanity', 'blueprints deploy')

    expect(result.helpText).toContain('arguments:')
    expect(result.helpText).toContain('flags:')
    expect(result.helpText).toContain('description:')
    expect(result.helpText).toContain('examples:')
    expect(result.helpText).not.toContain('ARGUMENTS')
    expect(result.helpText).not.toContain('FLAGS')
    expect(result.helpText).not.toContain('DESCRIPTION')
    expect(result.helpText).not.toContain('EXAMPLES')
    expect(result.helpText).not.toContain('USAGE')
  })

  it('handles helpText with no USAGE section', () => {
    const helpText = `FLAGS
  --verbose  Verbose output

DESCRIPTION
  Some command`

    const command = createMockCommand(helpText, 'Some command')
    const result = transformHelpText(command, 'sanity', 'some command')

    expect(result.signature).toBe('')
    expect(result.helpText).toContain('flags:')
    expect(result.helpText).toContain('description:')
  })
})
describe('createErrorLogger', () => {
  it('returns a function that logs an error message', () => {
    const output = {error: vi.fn()} as unknown as CliOutputter
    const errorLogger = createErrorLogger(output)
    expect(errorLogger).toBeInstanceOf(Function)
    errorLogger('test error', {exit: false})
    expect(output.error).toHaveBeenCalledWith('test error')
  })
})
