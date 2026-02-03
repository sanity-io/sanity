import {type ManifestWorkspaceFile} from '../../../../manifest/manifestTypes'
import {uniqBy} from 'lodash-es'

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
