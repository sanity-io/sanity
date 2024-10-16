import {describe, expect, it} from 'vitest'

import {groupChanges} from './groupChanges'
import {type FieldChange} from './parseTransactions'

describe('Tests grouping the changes', () => {
  it('Should group the changes done by the same user in the title field', () => {
    const changes: FieldChange[] = [
      {
        field: 'title',
        to: 'Prepare the tasks PR no',
        from: 'Prepare the tasks PR',
        timestamp: '2024-03-11T08:31:12.619628Z',
        author: 'piIz2Gfg5',
      },
      {
        field: 'title',
        from: 'Prepare the tasks PR no',
        to: 'Prepare the tasks PR now',
        timestamp: '2024-03-11T08:31:13.627854Z',
        author: 'piIz2Gfg5',
      },
    ]
    const output = groupChanges(changes)
    expect(output).toEqual([
      {
        field: 'title',
        from: 'Prepare the tasks PR',
        to: 'Prepare the tasks PR now',
        timestamp: '2024-03-11T08:31:13.627854Z',
        author: 'piIz2Gfg5',
      },
    ])
  })
  it('Should group the changes done by the same user in the title field, with a max of 5 minutes.', () => {
    const changes: FieldChange[] = [
      {
        field: 'title',
        to: 'Prepare the tasks PR no',
        from: 'Prepare the tasks PR',
        timestamp: '2024-03-11T08:31:12.619628Z',
        author: 'piIz2Gfg5',
      },
      {
        field: 'title',
        from: 'Prepare the tasks PR no',
        to: 'Prepare the tasks PR now',
        timestamp: '2024-03-11T08:31:13.627854Z',
        author: 'piIz2Gfg5',
      },
      {
        field: 'title',
        from: 'Prepare the tasks PR now',
        to: 'Prepare the tasks PR',
        timestamp: '2024-03-11T08:38:13.627854Z',
        author: 'piIz2Gfg5',
      },
    ]
    const output = groupChanges(changes)
    expect(output).toEqual([
      {
        field: 'title',
        from: 'Prepare the tasks PR',
        to: 'Prepare the tasks PR now',
        timestamp: '2024-03-11T08:31:13.627854Z',
        author: 'piIz2Gfg5',
      },
      {
        field: 'title',
        from: 'Prepare the tasks PR now',
        to: 'Prepare the tasks PR',
        timestamp: '2024-03-11T08:38:13.627854Z',
        author: 'piIz2Gfg5',
      },
    ])
  })
  it('Should not group the changes if the user did changes to other fields in between', () => {
    const changes: FieldChange[] = [
      {
        field: 'title',
        to: 'Prepare the tasks PR no',
        from: 'Prepare the tasks PR',
        timestamp: '2024-03-11T08:31:12.619628Z',
        author: 'piIz2Gfg5',
      },
      {
        field: 'assignedTo',
        from: 'old',
        to: 'new',
        timestamp: '2024-03-11T08:31:13.627854Z',
        author: 'piIz2Gfg5',
      },
      {
        field: 'title',
        from: 'Prepare the tasks PR no',
        to: 'Prepare the tasks PR now',
        timestamp: '2024-03-11T08:31:13.627854Z',
        author: 'piIz2Gfg5',
      },
    ]
    const output = groupChanges(changes)

    expect(output).toEqual(changes)
  })
})
