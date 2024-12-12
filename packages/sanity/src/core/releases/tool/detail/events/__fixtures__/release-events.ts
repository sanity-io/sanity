import {type ReleaseEvent} from '../types'

const author = 'author1'
const releaseName = 'release1'

export const publishedReleaseEvents: ReleaseEvent[] = [
  {
    id: '3',
    type: 'PublishRelease',
    author,
    timestamp: '2024-12-05T00:00:00Z',
    releaseName,
  },
  {
    id: '2',
    type: 'AddDocumentToRelease',
    author,
    timestamp: '2024-12-04T00:00:00Z',
    releaseName,
    documentId: 'foo',
    versionId: 'versions.release1.foo',
    revisionId: 'rev1',
    versionRevisionId: 'versions.release1.foo.rev1',
  },
  {
    id: '1',
    type: 'CreateRelease',
    author,
    timestamp: '2024-12-03T00:00:00Z',
    releaseName,
  },
]

export const archivedReleaseEvents: ReleaseEvent[] = [
  {
    id: '3',
    type: 'ArchiveRelease',
    author,
    timestamp: '2024-12-05T00:00:00Z',
    releaseName,
  },
  ...publishedReleaseEvents.slice(1),
]

export const unarchivedReleaseEvents: ReleaseEvent[] = [
  {
    id: '4',
    type: 'UnarchiveRelease',
    author,
    timestamp: '2024-12-06T00:00:00Z',
    releaseName,
  },
  ...archivedReleaseEvents,
]
