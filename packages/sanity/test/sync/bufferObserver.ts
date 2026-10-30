import {BufferedDocument, type Mutation} from '@sanity/mutator'
import {vi} from 'vitest'

export interface BufferOwner {
  client: string
  documentId: string
}

/** A commit that took buffered changes into the client's queue of saves. */
export interface CommitRecord extends BufferOwner {
  at: number
}

export interface BufferObserver {
  commits: CommitRecord[]
  /** Runs an edit and returns the clock value of the last change it put in a buffer. */
  edit: (owner: BufferOwner, action: () => void) => number
  stop: () => void
}

interface EditInProgress {
  owner?: BufferOwner
  lastAddAt?: number
}

// Watches the engine's buffers without changing them, so a lost edit can be told apart from one a commit queued and a rejection then discarded.
export function observeBuffers(stamp: () => number): BufferObserver {
  const owners = new WeakMap<BufferedDocument, BufferOwner>()
  const commits: CommitRecord[] = []
  const inProgress: EditInProgress = {}
  const originalAdd = BufferedDocument.prototype.add
  const originalCommit = BufferedDocument.prototype.commit

  const add = vi.spyOn(BufferedDocument.prototype, 'add').mockImplementation(function observedAdd(
    this: BufferedDocument,
    mutation: Mutation,
  ) {
    if (inProgress.owner) {
      owners.set(this, inProgress.owner)
      inProgress.lastAddAt = stamp()
    }
    return originalAdd.call(this, mutation)
  })
  const commit = vi
    .spyOn(BufferedDocument.prototype, 'commit')
    .mockImplementation(function observedCommit(this: BufferedDocument) {
      const owner = owners.get(this)
      if (owner && this.buffer.hasChanges()) commits.push({...owner, at: stamp()})
      return originalCommit.call(this)
    })

  function edit(owner: BufferOwner, action: () => void): number {
    inProgress.owner = owner
    inProgress.lastAddAt = undefined
    try {
      action()
    } finally {
      inProgress.owner = undefined
    }
    return inProgress.lastAddAt ?? stamp()
  }

  function stop(): void {
    add.mockRestore()
    commit.mockRestore()
  }

  return {commits, edit, stop}
}
