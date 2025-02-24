import {type ReleaseDocument} from '../store/types'

export const activeScheduledRelease: ReleaseDocument = {
  _rev: 'activeRev',
  _id: '_.releases.rActive',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'active',
  metadata: {
    title: 'active Release',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-10T10:00:00.000Z',
    description: 'active Release description',
  },
}

export const scheduledRelease: ReleaseDocument = {
  _rev: 'scheduledRev',
  _id: '_.releases.rScheduled',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'scheduled',
  publishAt: '2023-10-10T10:00:00Z',
  metadata: {
    title: 'scheduled Release',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-10T10:00:00Z',
    description: 'scheduled Release description',
  },
}

export const activeASAPRelease: ReleaseDocument = {
  _rev: 'activeASAPRev',
  _id: '_.releases.rASAP',
  _type: 'system.release',
  _createdAt: '2023-10-01T08:00:00Z',
  _updatedAt: '2023-10-01T09:00:00Z',
  state: 'active',
  metadata: {
    title: 'active asap Release',
    releaseType: 'asap',
    description: 'active Release description',
  },
}

export const activeASAPErrorRelease: ReleaseDocument = {
  _rev: 'activeASAPErrorRev',
  _id: '_.releases.rASAPError',
  _type: 'system.release',
  _createdAt: '2023-10-01T08:00:00Z',
  _updatedAt: '2023-10-01T09:00:00Z',
  state: 'active',
  metadata: {
    title: 'active asap Error Release',
    releaseType: 'asap',
    description: 'active Error Release description',
  },
  error: {
    message: 'An unexpected error occurred during publication.',
  },
}

export const archivedScheduledRelease: ReleaseDocument = {
  _rev: 'archivedRev',
  _id: '_.releases.rArchived',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'archived',
  metadata: {
    title: 'archived Release',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-10T10:00:00Z',
    description: 'archived Release description',
  },
}

export const publishedASAPRelease: ReleaseDocument = {
  _rev: 'publishedRev',
  _id: '_.releases.rPublished',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  publishedAt: '2023-10-10T10:00:00Z',
  state: 'published',
  metadata: {
    title: 'published Release',
    releaseType: 'asap',
    description: 'archived Release description',
  },
}

export const activeUndecidedRelease: ReleaseDocument = {
  _rev: 'undecidedRev',
  _id: '_.releases.rUndecided',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'active',
  metadata: {
    title: 'undecided Release',
    releaseType: 'undecided',
    description: 'undecided Release description',
  },
}

export const activeUndecidedErrorRelease: ReleaseDocument = {
  _rev: 'undecidedErrorRev',
  _id: '_.releases.rUndecidedError',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'active',
  metadata: {
    title: 'undecided Error Release',
    releaseType: 'undecided',
    description: 'undecided Error Release description',
  },
  error: {
    message: 'An unexpected error occurred during publication.',
  },
}
