import {describe, expect, it} from 'vitest'

import {groupDatasets} from './DatasetField'

const workspaces = [
  {name: 'default', title: 'Production', projectId: 'p1', dataset: 'production'},
  {name: 'staging', title: 'Staging', projectId: 'p1', dataset: 'staging'},
  {name: 'blog', title: 'Blog', projectId: 'p1', dataset: 'blog'},
  {name: 'preview', title: 'Preview', projectId: 'p1', dataset: 'staging'},
  {name: 'other', title: 'Other project', projectId: 'p2', dataset: 'archive'},
]
const datasets = ['production', 'zeta', 'staging', 'archive', 'blog', 'alpha']

const names = (entries: {dataset: string}[]) => entries.map((entry) => entry.dataset)

describe('groupDatasets', () => {
  it('lists the workspace datasets in switcher order, then the other datasets by name', () => {
    expect(
      groupDatasets({
        datasets,
        workspaceDataset: 'production',
        workspaces,
        projectId: 'p1',
        query: '',
      }),
    ).toEqual({
      workspace: [
        {dataset: 'staging', workspaces: ['Staging', 'Preview']},
        {dataset: 'blog', workspaces: ['Blog']},
      ],
      other: [
        {dataset: 'alpha', workspaces: []},
        {dataset: 'archive', workspaces: []},
        {dataset: 'zeta', workspaces: []},
      ],
    })
  })

  it('lists a dataset several workspaces use once, where the switcher first shows it', () => {
    const groups = groupDatasets({
      datasets: ['a', 'b', 'c', 'd'],
      workspaceDataset: 'd',
      workspaces: ['a', 'b', 'a', 'c'].map((dataset, index) => ({
        name: `w${index}`,
        title: `W${index}`,
        projectId: 'p1',
        dataset,
      })),
      projectId: 'p1',
      query: '',
    })
    expect(names(groups.workspace)).toEqual(['a', 'b', 'c'])
    expect(groups.workspace[0].workspaces).toEqual(['W0', 'W2'])
    expect(groups.other).toEqual([])
  })

  it('leaves the dataset Auto stands for, and other projects, out of both groups', () => {
    const groups = groupDatasets({
      datasets,
      workspaceDataset: 'staging',
      workspaces,
      projectId: 'p1',
      query: '',
    })
    expect(names(groups.workspace)).toEqual(['production', 'blog'])
    expect(names(groups.other)).toEqual(['alpha', 'archive', 'zeta'])
  })

  it('filters both groups by dataset name and workspace title', () => {
    const byTitle = groupDatasets({
      datasets,
      workspaceDataset: 'production',
      workspaces,
      projectId: 'p1',
      query: 'PREV',
    })
    expect(names(byTitle.workspace)).toEqual(['staging'])
    expect(byTitle.other).toEqual([])

    const byName = groupDatasets({
      datasets,
      workspaceDataset: 'production',
      workspaces,
      projectId: 'p1',
      query: 'a',
    })
    expect(names(byName.workspace)).toEqual(['staging'])
    expect(names(byName.other)).toEqual(['alpha', 'archive', 'zeta'])
  })

  it('leaves out workspace datasets the project does not list', () => {
    const groups = groupDatasets({
      datasets: ['production', 'staging'],
      workspaceDataset: 'production',
      workspaces,
      projectId: 'p1',
      query: '',
    })
    expect(names(groups.workspace)).toEqual(['staging'])
  })

  it('falls back to the datasets the workspaces use when the dataset list is unknown', () => {
    expect(
      groupDatasets({
        datasets: [],
        workspaceDataset: 'production',
        workspaces,
        projectId: 'p1',
        query: '',
      }),
    ).toEqual({
      workspace: [
        {dataset: 'staging', workspaces: ['Staging', 'Preview']},
        {dataset: 'blog', workspaces: ['Blog']},
      ],
      other: [],
    })
  })
})
