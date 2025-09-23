import {type PreviewConfig} from '@sanity/types'
import {defineField} from 'sanity'

import {OperatorSelectInput} from './OperatorSelectInput'
import {PropertySelectInput} from './PropertySelectInput'
import {TargetValueInput} from './TargetValueInput'

const rulePreview: PreviewConfig = {
  select: {
    property: 'property',
    operator: 'operator',
    targetValue: 'targetValue',
    and: 'and',
  },
  prepare(context) {
    const property = context.property
    const operator = context.operator
    const targetValue = context.targetValue
    const and = context.and as Rule[]
    return {
      title: `${property || ''} ${operator || ''} ${targetValue || ''} ${and ? `& ${and.map((a) => `${a.property || ''} ${a.operator || ''} ${a.targetValue || ''}`).join(' & ')}` : ''}`,
    }
  },
}

const rule = defineField({
  name: 'rule',
  type: 'object',
  fields: [
    defineField({
      name: 'property',
      title: 'Property',
      type: 'string',
      components: {
        input: PropertySelectInput,
      },
    }),
    defineField({
      name: 'operator',
      title: 'Operator',
      type: 'string',
      readOnly: ({parent}) => !parent.property,
      components: {
        input: OperatorSelectInput,
      },
    }),
    defineField({
      name: 'targetValue',
      title: 'Target Value',
      type: 'string',
      readOnly: ({parent}) => !parent.property,
      components: {
        input: TargetValueInput,
      },
    }),
  ],
  preview: rulePreview,
})

interface Rule {
  property: string
  operator: string
  targetValue: string
  and?: Rule[]
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
    fields: [
      defineField({
        name: 'default',
        title: 'Default Value',
        ...valueFieldConfig,
      }),
      defineField({
        name: 'conditions',
        title: 'Conditions',
        type: 'array',
        of: [
          defineField({
            type: 'object',
            name: 'condition',
            title: 'Condition',
            preview: {
              select: {
                rules: 'anyOf',
                value: 'value',
              },
              prepare(context) {
                const value = context.value
                const rules = (context.rules || []) as Rule[]

                return {
                  title: value,
                  subtitle: `${rules.map((r) => `${r.property || ''} ${r.operator || ''} ${r.targetValue || ''} ${r.and ? `& ${r.and.map((and) => `${and.property || ''} ${and.operator || ''} ${and.targetValue || ''}`).join(' & ')}` : ''}`).join(' | ')}`,
                }
              },
            },
            fields: [
              defineField({
                name: 'value',
                title: 'Value',
                ...valueFieldConfig,
              }),
              defineField({
                name: 'anyOf',
                title: 'Any of',
                description: 'If any of the rules are true, the condition is true',
                type: 'array',
                of: [
                  {
                    ...rule,
                    fields: [
                      ...rule.fields,
                      defineField({
                        name: 'and',
                        title: 'And',
                        type: 'array',
                        of: [rule],
                      }),
                    ],
                  },
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
