import {
  defineType,
  type FormNodeValidation,
  isStringSchemaType,
  type SchemaType,
  type TextSchemaType,
} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {type RefObject} from 'react'

import {type FormNodePresence} from '../../../presence/types'
import {createSchema} from '../../../schema/createSchema'
import {prepareDiffProps} from '../../store/formState'

/**
 * The schema the primitive input stories pick their types from. Every top-level type here is a
 * primitive, so `schema.get(name)` hands out the compiled primitive schema type directly.
 */
export const primitiveInputSchema = createSchema({
  name: 'primitive-inputs',
  types: [
    defineType({name: 'headline', type: 'string', title: 'Headline'}),
    defineType({name: 'bio', type: 'text', title: 'Bio', rows: 4}),
    defineType({name: 'website', type: 'url', title: 'Website'}),
    defineType({name: 'contactEmail', type: 'email', title: 'Email'}),
    defineType({name: 'phone', type: 'string', title: 'Phone'}),
    defineType({
      name: 'rating',
      type: 'number',
      title: 'Rating',
      validation: (rule) => rule.min(0).max(5),
    }),
    defineType({
      name: 'published',
      type: 'boolean',
      title: 'Published',
      description: 'Visible to readers',
    }),
    defineType({
      name: 'featured',
      type: 'boolean',
      title: 'Featured',
      options: {layout: 'checkbox'},
      description: 'Shown on the front page',
    }),
  ],
})

export function getPrimitiveSchemaType<S extends SchemaType>(
  name: string,
  isExpectedType: (schemaType: SchemaType) => schemaType is S,
): S {
  const schemaType = primitiveInputSchema.get(name)
  if (!schemaType) throw new Error(`Unknown primitive fixture type: ${name}`)
  if (!isExpectedType(schemaType)) {
    throw new Error(`Primitive fixture type ${name} has an unexpected shape`)
  }
  return schemaType
}

/** `TextSchemaType` only adds the optional `rows` to a string type, so the string guard decides. */
export function isTextSchemaType(schemaType: SchemaType): schemaType is TextSchemaType {
  return isStringSchemaType(schemaType)
}

export interface PrimitiveInputFixtureOptions<T> {
  value?: T
  placeholder?: string
  readOnly?: boolean
  focused?: boolean
  presence?: FormNodePresence[]
  validation?: FormNodeValidation[]
  validationError?: string
}

/**
 * Builds the props a primitive input receives from the form builder, without the form builder:
 * the diff props come from the production `prepareDiffProps`, everything else is inert.
 */
export function createPrimitiveInputProps<
  T extends string | number | boolean,
  S extends SchemaType,
>(schemaType: S, options: PrimitiveInputFixtureOptions<T> = {}) {
  const {
    value,
    placeholder,
    readOnly = false,
    focused = false,
    presence = [],
    validation = [],
    validationError,
  } = options

  return {
    renderDefault: () => <></>,
    displayInlineChanges: false,
    id: schemaType.name,
    schemaType,
    level: 0,
    path: [schemaType.name],
    presence,
    validation,
    value,
    readOnly,
    focused,
    ...prepareDiffProps<T>({
      schemaType,
      comparisonValue: value,
      value,
      hasUpstreamVersion: false,
      hasBaseVariant: false,
    }),
    changed: false,
    changedFromBaseVariant: false,
    onChange: noop,
    validationError,
    elementProps: {
      'id': schemaType.name,
      'value': typeof value === 'boolean' ? undefined : value?.toString(),
      'readOnly': readOnly,
      'placeholder': placeholder,
      'onChange': noop,
      'onFocus': noop,
      'onBlur': noop,
      'ref': {current: null} satisfies RefObject<HTMLInputElement | null>,
      'aria-describedby': undefined,
      'style': {},
    },
  }
}
