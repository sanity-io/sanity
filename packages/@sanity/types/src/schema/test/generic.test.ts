/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineField, defineType, Schema} from '../types'

describe('common type test', () => {
  it('should capture literal string type', () => {
    const stringDef = defineType({
      type: 'string',
      name: 'custom-string',
    })

    const typeName: 'custom-string' = stringDef.name
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
      {strict: true}
    )
    defineType(
      {
        type: 'string',
        name: 'custom-string',
        // strict mode disabled so unknown props are types as any
        doc18n: true,
      },
      {strict: false}
    )

    defineType(
      {
        type: 'string',
        name: 'custom-string',
        options: {
          custom: true,
        },
      },
      {strict: false}
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
})

export {}
