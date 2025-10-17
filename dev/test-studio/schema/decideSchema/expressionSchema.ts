import {defineField, defineType} from 'sanity'

import {type Expr} from './astType'
import {OperatorSelectInput} from './OperatorSelectInput'
import {PropertySelectInput} from './PropertySelectInput'
import {TargetValueInput} from './TargetValueInput'
import {ValueTypeInput} from './ValueTypeInput'

// Helper function to format expressions into readable strings
function formatExpr(expr: Expr): string {
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

// Expression (recursive) schema
export const expression = defineType({
  name: 'expr',
  title: 'Expression',
  type: 'object',
  fields: [
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: [
          {title: 'AND', value: 'and'},
          {title: 'OR', value: 'or'},
          // {title: 'NOT', value: 'not'}, // Not supported yet, could be added later
          {title: 'Comparison', value: 'cmp'},
        ],
      },
      hidden: true,
      readOnly: true,
      initialValue: 'cmp',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'exprs',
      title: 'Expressions',
      type: 'array',
      of: [{type: 'expr'}], // Recursive reference
      hidden: ({parent}) => parent?.kind === 'cmp',
    }),

    // For 'cmp' (comparison) - inline the compare fields
    defineField({
      name: 'attr',
      title: 'Attribute',
      type: 'string',
      components: {
        input: PropertySelectInput,
      },
      hidden: ({parent}) => parent?.kind !== 'cmp',
      validation: (Rule) =>
        Rule.custom((attr, context) => {
          const parent = context.parent as any
          if (parent?.kind === 'cmp' && !attr) {
            return 'Attribute is required for comparison'
          }
          return true
        }),
    }),
    defineField({
      name: 'op',
      title: 'Operator',
      type: 'string',
      options: {
        list: [
          {title: 'Equals', value: 'eq'},
          {title: 'Not Equals', value: 'neq'},
          {title: 'In', value: 'in'},
          {title: 'Not In', value: 'nin'},
          {title: 'Contains', value: 'contains'},
          {title: 'Not Contains', value: 'ncontains'},
          {title: 'Less Than', value: 'lt'},
          {title: 'Less Than or Equal', value: 'lte'},
          {title: 'Greater Than', value: 'gt'},
          {title: 'Greater Than or Equal', value: 'gte'},
          {title: 'Is Empty', value: 'empty'},
          {title: 'Is Not Empty', value: 'nempty'},
        ],
      },
      components: {
        input: OperatorSelectInput,
      },
      hidden: ({parent}) => parent?.kind !== 'cmp',
      validation: (Rule) =>
        Rule.custom((op, context) => {
          const parent = context.parent as any
          if (parent?.kind === 'cmp' && !op) {
            return 'Operator is required for comparison'
          }
          return true
        }),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      components: {
        input: TargetValueInput,
      },
      hidden: ({parent}) =>
        parent?.kind !== 'cmp' || parent?.op === 'exists' || parent?.op === 'empty',
    }),
    defineField({
      name: 'type',
      title: 'Value Type',
      type: 'string',
      readOnly: true,
      components: {
        input: ValueTypeInput,
      },
      options: {
        list: [
          {title: 'String', value: 'string'},
          {title: 'Number', value: 'number'},
          {title: 'Boolean', value: 'boolean'},
          {title: 'Set of Strings', value: 'set<string>'},
          {title: 'Set of Numbers', value: 'set<number>'},
        ],
      },
      hidden: ({parent}) => parent?.kind !== 'cmp' || true,
    }),
  ],
  preview: {
    select: {
      kind: 'kind',
      attr: 'attr',
      op: 'op',
      value: 'value',
      exprs: 'exprs',
    },
    prepare({kind, attr, op, value, exprs}) {
      if (exprs) {
        if (kind === 'and') {
          return {
            title: exprs.map((e: Expr) => formatExpr(e)).join(' && '),
            subtitle: 'Logical operation',
          }
        }
        if (kind === 'or') {
          return {
            title: exprs.map((e: Expr) => formatExpr(e)).join(' || '),
            subtitle: 'Logical operation',
          }
        }
      }

      if (kind === 'cmp') {
        return {
          title: `${attr || '?'} ${op || '?'} ${value}`,
          subtitle: 'Comparison',
        }
      }
      return {
        title: kind?.toUpperCase() || 'Expression',
        subtitle: 'Logical operation',
      }
    },
  },
})
