import {type ManifestWorkspaceFile} from '@sanity/schema/_internal'
import uniqBy from 'lodash-es/uniqBy.js'

export function uniqueProjectIdDataset(workspaces: ManifestWorkspaceFile[]) {
  return uniqBy(
    workspaces.map((w) => ({
      key: `${w.projectId}-${w.dataset}`,
      projectId: w.projectId,
      dataset: w.dataset,
    })),
    'key',
  )
}
