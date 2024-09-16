import traverse from '@babel/traverse'
import {parse, print} from 'recast'
import * as parser from 'recast/parsers/typescript'

const defaultTemplate = `
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
`

const defaultVariables = {
  projectName: 'Sanity Studio',
  sourceName: 'default',
  sourceTitle: 'Default',
}

export interface GenerateConfigOptions {
  template?: string | ((variables: GenerateConfigOptions['variables']) => string)
  variables: {
    projectId: string
    dataset: string
    autoUpdates: boolean
    projectName?: string
    sourceName?: string
    sourceTitle?: string
  }
}

export function createStudioConfig(options: GenerateConfigOptions): string {
  const variables = {...defaultVariables, ...options.variables}
  if (typeof options.template === 'function') {
    return options.template(variables).trimStart()
  }

  const template = (options.template || defaultTemplate).trimStart()
  const ast = parse(template, {parser})
  traverse(ast, {
    StringLiteral: {
      enter({node}) {
        const value = node.value
        if (!value.startsWith('%') || !value.endsWith('%')) {
          return
        }

        const variableName = value.slice(1, -1) as keyof GenerateConfigOptions['variables']
        if (!(variableName in variables)) {
          throw new Error(`Template variable '${value}' not defined`)
        }
        const newValue = variables[variableName]
        /*
         * although there are valid non-strings in our config,
         * they're not in this template, so assume undefined
         */
        node.value = typeof newValue === 'string' ? newValue : ''
      },
    },
  })

  return print(ast, {quote: 'single'}).code
}
