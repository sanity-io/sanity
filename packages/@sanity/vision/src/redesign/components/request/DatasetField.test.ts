import {describe, expect, it} from 'vitest'

import {listOtherDatasets} from './DatasetField'

const workspaces = [
  {name: 'default', title: 'Production', projectId: 'p1', dataset: 'production'},
  {name: 'staging', title: 'Staging', projectId: 'p1', dataset: 'staging'},
  {name: 'preview', title: 'Preview', projectId: 'p1', dataset: 'staging'},
  {name: 'other', title: 'Other project', projectId: 'p2', dataset: 'archive'},
]
const datasets = ['production', 'zeta', 'staging', 'archive', 'alpha']

describe('listOtherDatasets', () => {
  it('lists every dataset but the workspace one, by name, with the workspaces that use it', () => {
    expect(
      listOtherDatasets({
        datasets,
        workspaceDataset: 'production',
        workspaces,
        projectId: 'p1',
        query: '',
      }),
    ).toEqual([
      {dataset: 'alpha', workspaces: []},
      {dataset: 'archive', workspaces: []},
      {dataset: 'staging', workspaces: ['Staging', 'Preview']},
      {dataset: 'zeta', workspaces: []},
    ])
  })

  it('filters by dataset name and workspace title', () => {
    expect(
      listOtherDatasets({
        datasets,
        workspaceDataset: 'production',
        workspaces,
        projectId: 'p1',
        query: 'PREV',
      }),
    ).toEqual([{dataset: 'staging', workspaces: ['Staging', 'Preview']}])
    expect(
      listOtherDatasets({
        datasets,
        workspaceDataset: 'production',
        workspaces,
        projectId: 'p1',
        query: 'a',
      }).map((entry) => entry.dataset),
    ).toEqual(['alpha', 'archive', 'staging', 'zeta'])
  })

  it('falls back to the datasets the workspaces use when the dataset list is unknown', () => {
    expect(
      listOtherDatasets({
        datasets: [],
        workspaceDataset: 'production',
        workspaces,
        projectId: 'p1',
        query: '',
      }),
    ).toEqual([{dataset: 'staging', workspaces: ['Staging', 'Preview']}])
  })
})
