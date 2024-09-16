import traverse from '@babel/traverse'
import {parse, print} from 'recast'
import * as parser from 'recast/parsers/typescript'

const defaultTemplate = `
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '%projectId%',
    dataset: '%dataset%'
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: __BOOL__autoUpdates__,
})
`

export interface GenerateCliConfigOptions {
  projectId: string
  dataset: string
  autoUpdates: boolean
}

export function createCliConfig(options: GenerateCliConfigOptions): string {
  const variables = options
  const template = defaultTemplate.trimStart()
  const ast = parse(template, {parser})

  traverse(ast, {
    StringLiteral: {
      enter({node}) {
        const value = node.value
        if (!value.startsWith('%') || !value.endsWith('%')) {
          return
        }
        const variableName = value.slice(1, -1) as keyof GenerateCliConfigOptions
        if (!(variableName in variables)) {
          throw new Error(`Template variable '${value}' not defined`)
        }
        const newValue = variables[variableName]
        /*
         * although there are valid non-strings in our config,
         * they're not in StringLiteral nodes, so assume undefined
         */
        node.value = typeof newValue === 'string' ? newValue : ''
      },
    },
    Identifier: {
      enter(path) {
        if (!path.node.name.startsWith('__BOOL__')) {
          return
        }
        const variableName = path.node.name.replace(
          /^__BOOL__(.+?)__$/,
          '$1',
        ) as keyof GenerateCliConfigOptions
        if (!(variableName in variables)) {
          throw new Error(`Template variable '${variableName}' not defined`)
        }
        const value = variables[variableName]
        if (typeof value !== 'boolean') {
          throw new Error(`Expected boolean value for '${variableName}'`)
        }
        path.replaceWith({type: 'BooleanLiteral', value})
      },
    },
  })

  return print(ast, {quote: 'single'}).code
}
