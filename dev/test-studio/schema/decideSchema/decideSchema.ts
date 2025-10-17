import {uuid} from '@sanity/uuid'
import {defineField} from 'sanity'

import {
  DecideObjectField,
  DecideObjectInput,
  VariantObjectField,
  WhenExpressionInput,
} from './DecideComponents'

// Helper function to format expressions into readable strings
function formatExpr(expr: any): string {
  if (!expr) return ''

  if (expr.kind === 'cmp') {
    const attr = expr.attr || '?'
    const op = expr.op || '?'
    const value = expr.value ?? ''
    return `${attr} ${op} ${value}`
  }

  if (expr.kind === 'and') {
    const exprs = expr.exprs || []
    return exprs
      .map((e: any) => formatExpr(e))
      .filter(Boolean)
      .join(' & ')
  }

  if (expr.kind === 'or') {
    const exprs = expr.exprs || []
    return exprs
      .map((e: any) => formatExpr(e))
      .filter(Boolean)
      .join(' | ')
  }

  if (expr.kind === 'not') {
    return `NOT (${formatExpr(expr.expr)})`
  }

  return ''
}

// Generic decide field implementation that works for all types
export const defineLocalDecideField = (config: any) => {
  const {name, title, description, type, ...otherConfig} = config

  const valueFieldConfig = {
    type,
    // ...(to && {to}),
    // ...(validation && {validation}),
    // ...(description && {description}),
    // ...(readOnly && {readOnly}),
    // ...(hidden && {hidden}),
    ...otherConfig,
  }

  return defineField({
    name,
    title,
    description,
    type: 'object',
    components: {
      field: DecideObjectField,
      input: DecideObjectInput,
    },
    fields: [
      defineField({
        name: 'default',
        title: title || name,
        ...valueFieldConfig,
      }),
      defineField({
        name: 'variants',
        title: 'Variants',
        type: 'array',
        of: [
          defineField({
            type: 'object',
            name: 'variant',
            title: 'Variant',
            components: {
              field: VariantObjectField,
            },
            preview: {
              select: {
                when: 'when',
                value: 'value',
              },
              prepare(context) {
                const value = context.value
                const when = context.when
                const condition = formatExpr(when)

                return {
                  title: `${value}`,
                  subtitle: condition || 'No condition',
                }
              },
            },
            fields: [
              defineField({
                name: 'when',
                title: 'When',
                type: 'expr',
                components: {
                  input: WhenExpressionInput,
                },
                initialValue: {
                  exprs: [
                    {
                      _key: uuid(),
                      _type: 'expr',
                      exprs: [],
                      kind: 'and',
                    },
                  ],
                  kind: 'or',
                },
              }),
              defineField({
                name: 'value',
                title: 'Then value',
                ...valueFieldConfig,
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
