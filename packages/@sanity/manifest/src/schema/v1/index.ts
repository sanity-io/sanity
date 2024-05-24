import z from 'zod'

export const manifestV1Deprecation = z.object({
  reason: z.string(),
})

export const manifestV1TypeValidationRule = z.object({
  flag: z.literal('type'),
  constraint: z.union([
    z.literal('array'),
    z.literal('boolean'),
    z.literal('date'),
    z.literal('number'),
    z.literal('object'),
    z.literal('string'),
  ]),
})

export type ManifestV1TypeValidationRule = z.infer<typeof manifestV1TypeValidationRule>

// TOOD: Constraints
export const manifestV1UriValidationRule = z.object({
  flag: z.literal('uri'),
})

// TODO
// export const manifestV1ValidationRule = z.any()
export const manifestV1ValidationRule = z.union([
  manifestV1TypeValidationRule,
  manifestV1UriValidationRule,
  // TODO: Remove
  z.any(),
])

export type ManifestV1ValidationRule = z.infer<typeof manifestV1ValidationRule>

export const manifestV1ValidationGroup = z.object({
  rules: z.array(manifestV1ValidationRule),
  message: z.string().optional(),
  level: z.union([z.literal('error'), z.literal('warning'), z.literal('info')]).optional(),
})

export type ManifestV1ValidationGroup = z.infer<typeof manifestV1ValidationGroup>

export const manifestV1Reference = z.object({
  type: z.string(),
})

export type ManifestV1Reference = z.infer<typeof manifestV1Reference>

export const manifestV1ReferenceGroup = z.array(manifestV1Reference)

export type ManifestV1ReferenceGroup = z.infer<typeof manifestV1ReferenceGroup>

const _base = z.object({
  type: z.string(),
  name: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  deprecated: manifestV1Deprecation.optional(),
  readOnly: z.boolean().optional(), // xxx
  hidden: z.boolean().optional(), // xxx
  validation: z.array(manifestV1ValidationGroup).optional(),
  to: manifestV1ReferenceGroup.optional(),
  of: z.any(),
  preview: z
    .object({
      select: z.record(z.string(), z.string()),
    })
    .optional(),
})

const manifestV1TypeBase: z.ZodType<ManifestV1Type> = _base.extend({
  fields: z.array(z.lazy(() => manifestV1Field)).optional(),
})

export const manifestV1Field = manifestV1TypeBase

export type ManifestV1Field = z.infer<typeof manifestV1Field>

// export const ManifestV1TypeSchema = ManifestV1TypeBaseSchema.extend({
//   readOnly: z.boolean().optional(),
//   hidden: z.boolean().optional(),
//   preview: z
//     .object({
//       select: z.record(z.string(), z.string()),
//     })
//     .optional(),
// })

export type ManifestV1Type = z.infer<typeof _base> & {
  fields?: ManifestV1Field[]
}

export const manifestV1Schema = z.array(manifestV1TypeBase)

export const ManifestSchema = z.object({manifestVersion: z.number()})

export const manifestV1Workspace = z.object({
  name: z.string(),
  dataset: z.string(),
  schema: z.union([manifestV1Schema, z.string()]), // xxx don't actually want string here, but allows us to replace with filename
})

export type ManifestV1Workspace = z.infer<typeof manifestV1Workspace>

export const manifestV1 = ManifestSchema.extend({
  createdAt: z.date(),
  workspaces: z.array(manifestV1Workspace),
})

export type ManifestV1 = z.infer<typeof manifestV1>
