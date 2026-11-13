import {describe, expect, it} from 'vitest'

import {groupDatasets} from './DatasetField'

const workspaces = [
  {name: 'default', title: 'Production', projectId: 'p1', dataset: 'production'},
  {name: 'staging', title: 'Staging', projectId: 'p1', dataset: 'staging'},
  {name: 'preview', title: 'Preview', projectId: 'p1', dataset: 'staging'},
  {name: 'other', title: 'Other project', projectId: 'p2', dataset: 'archive'},
]
const datasets = ['production', 'zeta', 'staging', 'archive', 'alpha']

describe('groupDatasets', () => {
  it('puts the workspace dataset first, then those other workspaces use, then the rest', () => {
    expect(
      groupDatasets({
        datasets,
        workspaceDataset: 'production',
        workspaces,
        projectId: 'p1',
        query: '',
      }),
    ).toEqual({
      current: {dataset: 'production', workspaces: ['Production']},
      used: [{dataset: 'staging', workspaces: ['Staging', 'Preview']}],
      unused: [
        {dataset: 'alpha', workspaces: []},
        {dataset: 'archive', workspaces: []},
        {dataset: 'zeta', workspaces: []},
      ],
    })
  })

  it('filters every group by dataset name and workspace title', () => {
    expect(
      groupDatasets({
        datasets,
        workspaceDataset: 'production',
        workspaces,
        projectId: 'p1',
        query: 'PREV',
      }),
    ).toEqual({
      current: null,
      used: [{dataset: 'staging', workspaces: ['Staging', 'Preview']}],
      unused: [],
    })
    expect(
      groupDatasets({
        datasets,
        workspaceDataset: 'production',
        workspaces,
        projectId: 'p1',
        query: 'a',
      }),
    ).toMatchObject({
      current: null,
      unused: [{dataset: 'alpha'}, {dataset: 'archive'}, {dataset: 'zeta'}],
    })
  })
})
