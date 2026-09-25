import {type VistaTabOptions} from '../store/types'

/** The dataset a tab queries: the workspace's while following it, otherwise the pinned one */
export function getTabDataset(options: VistaTabOptions, workspaceDataset: string): string {
  return options.datasetMode === 'workspace' ? workspaceDataset : options.dataset
}
