import {act, renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {
  comment,
  createAddonDatasetTestClient,
  mutation,
  task,
  WELCOME,
} from '../../../store/addonDatasetListener/__fixtures__/addonDataset.fixture'
import {useTasksStore} from '../useTasksStore'

function useTasks() {
  return useTasksStore({})
}

function titles(documents: {_id: string; title: string}[] | null) {
  return (documents ?? []).map((document) => [document._id, document.title])
}

async function renderConnected(...args: Parameters<typeof createAddonDatasetTestClient>) {
  const testClient = createAddonDatasetTestClient(...args)
  const rendered = renderHook(useTasks, {wrapper: testClient.wrapper})

  await act(async () => {
    testClient.server.next(WELCOME)
  })
  await waitFor(() => expect(rendered.result.current.isLoading).toBe(false))

  return {...testClient, ...rendered}
}

describe('useTasksStore', () => {
  it('loads the tasks once the addon dataset listener connects, and follows their changes', async () => {
    const {result, server, connections} = await renderConnected({tasks: [task('t-1')]})

    expect(connections.opened).toBe(1)
    expect(titles(result.current.data)).toEqual([['t-1', 'A task']])

    await act(async () => {
      server.next(mutation('appear', 't-2', task('t-2')))
      server.next(mutation('update', 't-1', task('t-1', 'Renamed')))
    })
    expect(titles(result.current.data)).toEqual([
      ['t-1', 'Renamed'],
      ['t-2', 'A task'],
    ])

    await act(async () => {
      server.next(mutation('disappear', 't-2'))
    })
    expect(titles(result.current.data)).toEqual([['t-1', 'Renamed']])
  })

  it('ignores the comments the shared listener also reports', async () => {
    const {result, server} = await renderConnected({tasks: [task('t-1')]})
    const data = result.current.data

    await act(async () => {
      server.next(mutation('appear', 'c-1', comment('c-1', 'doc-a')))
      server.next(mutation('update', 'c-1', comment('c-1', 'doc-a', {status: 'resolved'})))
      server.next(mutation('disappear', 'c-1'))
    })

    expect(result.current.data).toBe(data)
  })
})
