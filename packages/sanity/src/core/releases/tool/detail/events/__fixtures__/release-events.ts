import {type ReleaseEvent} from '../types'

const author = 'author1'
const releaseName = 'release1'

export const publishedReleaseEvents: ReleaseEvent[] = [
  {
    id: '3',
    type: 'publishRelease',
    author,
    timestamp: '2024-12-05T00:00:00Z',
    releaseName,
    origin: 'events',
  },
  {
    id: '2',
    type: 'addDocumentToRelease',
    author,
    timestamp: '2024-12-04T00:00:00Z',
    releaseName,
    documentId: 'foo',
    documentType: 'author',
    versionId: 'versions.release1.foo',
    revisionId: 'rev1',
    versionRevisionId: 'versions.release1.foo.rev1',
    origin: 'events',
  },
  {
    id: '1',
    type: 'createRelease',
    author,
    timestamp: '2024-12-03T00:00:00Z',
    origin: 'events',
    releaseName,
  },
]

export const archivedReleaseEvents: ReleaseEvent[] = [
  {
    id: '3',
    type: 'archiveRelease',
    author,
    timestamp: '2024-12-05T00:00:00Z',
    releaseName,
    origin: 'events',
  },
  ...publishedReleaseEvents.slice(1),
]

export const unarchivedReleaseEvents: ReleaseEvent[] = [
  {
    id: '4',
    type: 'unarchiveRelease',
    origin: 'events',
    author,
    timestamp: '2024-12-06T00:00:00Z',
    releaseName,
  },
  ...archivedReleaseEvents,
]
