import {describe, expect, it} from 'vitest'

import {normalizedConfigSchema} from '../readConfig'

describe('normalizedConfigSchema', () => {
  const defaultPaths = [
    './src/**/*.{ts,tsx,js,jsx,mjs,cjs,astro}',
    './app/**/*.{ts,tsx,js,jsx,mjs,cjs}',
    './sanity/**/*.{ts,tsx,js,jsx,mjs,cjs}',
  ]

  it('should parse an empty object and apply defaults', () => {
    const result = normalizedConfigSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        path: defaultPaths,
        schemas: [
          {
            schemaId: 'default',
            schemaPath: './schema.json',
          },
        ],
        generates: './sanity.types.ts',
        formatGeneratedCode: true,
        overloadClientMethods: true,
        augmentGroqModule: true,
      })
    }
  })

  it('should parse with a custom schema path', () => {
    const result = normalizedConfigSchema.safeParse({schema: './custom/schema.json'})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        path: defaultPaths,
        schemas: [
          {
            schemaId: 'default',
            schemaPath: './custom/schema.json',
          },
        ],
        generates: './sanity.types.ts',
        formatGeneratedCode: true,
        overloadClientMethods: true,
        augmentGroqModule: true,
      })
    }
  })

  it('should parse with a valid unstable_schemas array (single item)', () => {
    const unstable_schemas = [{schemaId: 's1', schemaPath: './schemas/s1.json'}]
    const result = normalizedConfigSchema.safeParse({unstable_schemas})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.schemas).toEqual(unstable_schemas)
    }
  })

  it('should parse with a valid unstable_schemas array (multiple items)', () => {
    const unstable_schemas = [
      {schemaId: 's1', schemaPath: './schemas/s1.json'},
      {schemaId: 's2', schemaPath: './schemas/s2.json'},
    ]
    const result = normalizedConfigSchema.safeParse({unstable_schemas})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.schemas).toEqual(unstable_schemas)
    }
  })

  it('should parse with overridden optional fields', () => {
    const config = {
      schema: './my/schema.json',
      path: './custom/path/**/*.ts',
      generates: './types/generated.ts',
      formatGeneratedCode: false,
      overloadClientMethods: false,
    }
    const result = normalizedConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        path: [config.path],
        schemas: [
          {
            schemaId: 'default',
            schemaPath: config.schema,
          },
        ],
        generates: config.generates,
        formatGeneratedCode: config.formatGeneratedCode,
        overloadClientMethods: config.overloadClientMethods,
        augmentGroqModule: true,
      })
    }

    // Test with unstable_schemas array as well
    const configWithUnstableSchemas = {
      unstable_schemas: [{schemaId: 's1', schemaPath: './s.json'}],
      path: ['path1', 'path2'],
      generates: './types/generated2.ts',
      formatGeneratedCode: false,
      overloadClientMethods: false,
    }
    const result2 = normalizedConfigSchema.safeParse(configWithUnstableSchemas)
    expect(result2.success).toBe(true)
    if (result2.success) {
      expect(result2.data).toEqual({
        path: configWithUnstableSchemas.path,
        generates: configWithUnstableSchemas.generates,
        formatGeneratedCode: configWithUnstableSchemas.formatGeneratedCode,
        overloadClientMethods: configWithUnstableSchemas.overloadClientMethods,
        augmentGroqModule: true,
        schemas: configWithUnstableSchemas.unstable_schemas,
      })
    }
  })

  it('should fail if both schema and unstable_schemas are provided', () => {
    const result = normalizedConfigSchema.safeParse({
      schema: './schema.json',
      unstable_schemas: [{schemaId: 's1', schemaPath: './schemas/s1.json'}],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain(
        'Configuration cannot contain both "schema" and "unstable_schemas". Use one or the other.',
      )
    }
  })

  it('should fail if unstable_schemas is an empty array', () => {
    const result = normalizedConfigSchema.safeParse({unstable_schemas: []})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'custom',
            message:
              '"unstable_schemas" array cannot be empty. Please provide at least one schema definition or use the "schema" property instead.',
          }),
        ]),
      )
    }
  })

  it('should fail if unstable_schemas item is missing schemaPath', () => {
    const result = normalizedConfigSchema.safeParse({
      unstable_schemas: [{schemaId: 's1'} as any],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'invalid_type',
            path: ['unstable_schemas', 0, 'schemaPath'],
            message: 'Required',
          }),
        ]),
      )
    }
  })

  it('should fail if unstable_schemas item is missing schemaId', () => {
    const result = normalizedConfigSchema.safeParse({
      unstable_schemas: [{schemaPath: './schemas/s1.json'}],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'invalid_type',
            path: ['unstable_schemas', 0, 'schemaId'],
            message: 'Required',
          }),
        ]),
      )
    }
  })
})
