import {parse, print} from 'recast'
import * as parser from 'recast/parsers/typescript'
import traverse from '@babel/traverse'

export function substituteTemplateVariables(_template: string, variables: Record<string, string>) {
  const template = _template.trimStart()
  const ast = parse(template, {parser})
  traverse(ast, {
    StringLiteral: {
      enter({node}) {
        const value = node.value
        if (!value.startsWith('%') || !value.endsWith('%')) {
          return
        }

        const variableName = value.slice(1, -1)
        if (!(variableName in variables)) {
          throw new Error(`Template variable '${value}' not defined`)
        }
        node.value = variables[variableName] || ''
      },
    },
  })

  return print(ast, {quote: 'single'}).code
}
