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
  autoUpdates: %autoUpdates%,
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
    enter(path) {
      if (path.node.type === 'StringLiteral') {
        const value = path.node.value
        if (!value.startsWith('%') || !value.endsWith('%')) {
          return
        }
        const variableName = value.slice(1, -1) as keyof GenerateCliConfigOptions
        if (!(variableName in variables)) {
          throw new Error(`Template variable '${value}' not defined`)
        }
        const variableValue = variables[variableName]
        if (typeof variableValue === 'boolean') {
          path.replaceWith({
            type: 'BooleanLiteral',
            value: variableValue,
          })
        } else if (typeof variableValue === 'string') {
          path.replaceWith({
            type: 'StringLiteral',
            value: variableValue,
          })
        } else {
          throw new Error(`Unsupported variable type for '${variableName}'`)
        }
      }
    },
  })

  return print(ast, {quote: 'single'}).code
}
