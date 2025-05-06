/* eslint-disable camelcase */
import {readFile} from 'node:fs/promises'

import * as json5 from 'json5'
import * as z from 'zod'

const defaultPaths = [
  './src/**/*.{ts,tsx,js,jsx,mjs,cjs,astro}',
  './app/**/*.{ts,tsx,js,jsx,mjs,cjs}',
  './sanity/**/*.{ts,tsx,js,jsx,mjs,cjs}',
]

/**
 * Define a raw config schema that accepts either a single 'schema' or an array 'schemas'.
 *
 * @remarks
 * - Both fields are optional, but if both are provided, that is an error
 * - If 'schemas' is provided, it cannot be an empty array
 */
const rawConfigSchema = z
  .object({
    path: z.union([z.string(), z.array(z.string())]).optional(),
    generates: z.string().optional(),
    formatGeneratedCode: z.boolean().optional(),
    overloadClientMethods: z.boolean().optional(),
    augmentGroqModule: z.boolean().optional(),
    schema: z.string().optional(),
    unstable_schemas: z.array(z.object({schemaPath: z.string(), schemaId: z.string()})).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.schema !== undefined && data.unstable_schemas !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Configuration cannot contain both "schema" and "unstable_schemas". Use one or the other.',
      })
    }
  })
  .refine((d) => d.unstable_schemas === undefined || d.unstable_schemas.length > 0, {
    message:
      '"unstable_schemas" array cannot be empty. Please provide at least one schema definition or use the "schema" property instead.',
  })

export type CodegenConfig = z.infer<typeof rawConfigSchema>

/**
 * Normalized config type always containing a "schemas" array and no "schema" property
 */
export type NormalizedCodegenConfig = {
  path: string[]
  generates: string
  formatGeneratedCode: boolean
  overloadClientMethods: boolean
  augmentGroqModule: boolean
  schemas: Array<{schemaId: string; schemaPath: string}>
}

// Transform the raw config to normalized output by applying defaults and ensuring a schemas array exists.
export const normalizedConfigSchema = rawConfigSchema.transform((d) => ({
  path: typeof d.path === 'string' ? [d.path] : (d.path ?? defaultPaths),
  generates: d.generates ?? './sanity.types.ts',
  formatGeneratedCode: d.formatGeneratedCode ?? true,
  overloadClientMethods: d.overloadClientMethods ?? true,
  augmentGroqModule: d.augmentGroqModule ?? true,
  schemas: d.unstable_schemas
    ? d.unstable_schemas.map((s) => ({
        schemaPath: s.schemaPath,
        schemaId: s.schemaId,
      }))
    : [{schemaId: 'default', schemaPath: d.schema ?? './schema.json'}],
}))

export const DEFAULT_CONFIG: NormalizedCodegenConfig = normalizedConfigSchema.parse({})

export async function readConfig(path: string): Promise<NormalizedCodegenConfig> {
  try {
    const content = await readFile(path, 'utf-8')
    const json = json5.parse(content)
    return normalizedConfigSchema.parse(json)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Error in config file\n ${error.errors.map((err) => err.message).join('\n')}`)
    }
    throw error
  }
}
