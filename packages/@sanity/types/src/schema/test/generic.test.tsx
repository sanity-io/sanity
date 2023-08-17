/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import React from 'react'
import {defineArrayMember, defineField, defineType} from '../types'

describe('common type test', () => {
  it('should capture literal string type', () => {
    const stringDef = defineType({
      type: 'string',
      name: 'custom-string',
    })

    let type: 'string' = stringDef.type
    let name: 'custom-string' = stringDef.name

    const stringField = defineField({
      type: 'string',
      name: 'custom-string',
    })

    type = stringField.type
    name = stringField.name

    const stringArrayOf = defineArrayMember({
      type: 'string',
      name: 'custom-string',
    })

    const arrayOfType: 'string' = stringArrayOf.type
    const arrayOfName: 'custom-string' | undefined = stringArrayOf.name
  })

  it('should support using all the define functions within each-other', () => {
    defineType({
      type: 'object',
      name: 'custom-object',
      fields: [
        defineField({
          type: 'array',
          name: 'arrayField',
          title: 'Things',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'type-name-in-array',
              fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
            }),
          ],
        }),
      ],
    })
  })

  it('should support optional strictness', () => {
    defineType({
      type: 'string',
      name: 'custom-string',
      //@ts-expect-error we are in strict mode, so this is not allowed
      doc18n: true,
    })
    defineType(
      {
        type: 'string',
        name: 'custom-string',
        //@ts-expect-error we are in strict mode, so this is not allowed
        doc18n: true,
      },
      {strict: true},
    )
    defineType(
      {
        type: 'string',
        name: 'custom-string',
        // strict mode disabled so unknown props are types as any
        doc18n: true,
      },
      {strict: false},
    )

    defineType(
      {
        type: 'string',
        name: 'custom-string',
        options: {
          custom: true,
        },
      },
      {strict: false},
    )
  })

  it('should fail for missing fields', () => {
    defineType({
      //@ts-expect-error did you mean to write type?
      type1: 'string',
    })

    //@ts-expect-error name is missing
    defineType({
      type: 'string',
    })

    defineType({
      type: 'string',
      name: 'custom-string',
      //@ts-expect-error disallow unknown props
      unknownProp: false,
    })
  })

  it('should allow ReactElement for description', () => {
    defineType({
      type: 'text',
      name: 'text',
      description: 'Some text',
    })

    defineType({
      type: 'text',
      name: 'text',
      description: <strong>Some like it bold</strong>,
    })

    defineType({
      type: 'text',
      name: 'text',
      //@ts-expect-error ReactElement but not ReactNode
      description: () => <strong>Render function not supported </strong>,
    })
  })
})

export {}
