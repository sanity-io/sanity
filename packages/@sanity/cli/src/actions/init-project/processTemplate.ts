import traverse from '@babel/traverse'
import {parse, print} from 'recast'
import * as parser from 'recast/parsers/typescript'

interface TemplateOptions<T> {
  template: string
  variables: T
  includeBooleanTransform?: boolean
}

export function processTemplate<T extends object>(options: TemplateOptions<T>): string {
  const {template, variables, includeBooleanTransform = false} = options
  const ast = parse(template.trimStart(), {parser})

  traverse(ast, {
    StringLiteral: {
      enter({node}) {
        const value = node.value
        if (!value.startsWith('%') || !value.endsWith('%')) {
          return
        }
        const variableName = value.slice(1, -1) as keyof T
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
    ...(includeBooleanTransform && {
      Identifier: {
        enter(path) {
          if (!path.node.name.startsWith('__BOOL__')) {
            return
          }
          const variableName = path.node.name.replace(/^__BOOL__(.+?)__$/, '$1') as keyof T
          if (!(variableName in variables)) {
            throw new Error(`Template variable '${variableName.toString()}' not defined`)
          }
          const value = variables[variableName]
          if (typeof value !== 'boolean') {
            throw new Error(`Expected boolean value for '${variableName.toString()}'`)
          }
          path.replaceWith({type: 'BooleanLiteral', value})
        },
      },
    }),
  })

  return print(ast, {quote: 'single'}).code
}
