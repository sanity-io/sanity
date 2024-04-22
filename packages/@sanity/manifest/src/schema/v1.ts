import z from 'zod'

export const ManifestSchema = z.object({manifestVersion: z.number()})

export const ManifestV1WorkspaceSchema = z.object({
  name: z.string(),
  dataset: z.string(),
  schema: z.string(),
})

export type ManifestV1Workspace = z.infer<typeof ManifestV1WorkspaceSchema>

export const ManifestV1Schema = ManifestSchema.extend({
  createdAt: z.date(),
  workspaces: z.array(ManifestV1WorkspaceSchema),
})

export type ManifestV1 = z.infer<typeof ManifestV1Schema>
