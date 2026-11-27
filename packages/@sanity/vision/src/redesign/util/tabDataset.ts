import {type VisionTabOptions} from '../store/types'

/** The dataset a tab queries: the workspace's on Auto, otherwise its override */
export function getTabDataset(options: VisionTabOptions, workspaceDataset: string): string {
  return options.datasetMode === 'auto' ? workspaceDataset : options.dataset
}
