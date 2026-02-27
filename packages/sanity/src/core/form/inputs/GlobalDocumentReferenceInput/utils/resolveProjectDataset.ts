export function resolveProjectDataset(
  resourceType: string,
  resourceId: string,
): {
  projectId: string
  dataset: string
} | null {
  if (resourceType !== 'dataset') {
    return null
  }
  const [projectId, dataset] = resourceId.split('.', 2)
  if (!projectId || !dataset) {
    throw new Error(`Invalid resource ID for resource "dataset": ${resourceId}`)
  }
  return {
    projectId,
    dataset,
  }
}
