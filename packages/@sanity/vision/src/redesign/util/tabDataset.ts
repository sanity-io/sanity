import {type VisionTabOptions} from '../store/types'

/** The dataset a tab queries: the workspace's while following it, otherwise the pinned one */
export function getTabDataset(options: VisionTabOptions, workspaceDataset: string): string {
  return options.datasetMode === 'workspace' ? workspaceDataset : options.dataset
}
