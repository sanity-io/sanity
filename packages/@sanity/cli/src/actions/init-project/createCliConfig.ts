import {parse, print} from 'recast'
import * as parser from 'recast/parsers/typescript'
import traverse from '@babel/traverse'

const defaultTemplate = `
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '%projectId%',
    dataset: '%dataset%'
  }
})
`

export interface GenerateCliConfigOptions {
  projectId: string
  dataset: string
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

        node.value = variables[variableName] || ''
      },
    },
  })

  return print(ast, {quote: 'single'}).code
}
