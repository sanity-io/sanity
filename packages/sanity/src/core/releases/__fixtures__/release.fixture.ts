import {type ReleaseDocument} from '../store/types'

export const activeScheduledRelease: ReleaseDocument = {
  _rev: 'activeRev',
  _id: '_.releases.activeRelease',
  _type: 'system.release',
  createdBy: '',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'active',
  name: 'activeRelease',
  metadata: {
    title: 'active Release',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-10T10:00:00Z',
    description: 'active Release description',
  },
}

export const scheduledRelease: ReleaseDocument = {
  _rev: 'scheduledRev',
  _id: '_.releases.scheduledRelease',
  _type: 'system.release',
  createdBy: '',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'scheduled',
  name: 'scheduledRelease',
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
  _id: '_.releases.activeASAPRelease',
  _type: 'system.release',
  createdBy: '',
  _createdAt: '2023-10-01T08:00:00Z',
  _updatedAt: '2023-10-01T09:00:00Z',
  state: 'active',
  name: 'activeRelease',
  metadata: {
    title: 'active asap Release',
    releaseType: 'asap',
    description: 'active Release description',
  },
}

export const archivedScheduledRelease: ReleaseDocument = {
  _rev: 'archivedRev',
  _id: '_.releases.archivedRelease',
  _type: 'system.release',
  createdBy: '',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'archived',
  name: 'archivedRelease',
  metadata: {
    title: 'archived Release',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-10T10:00:00Z',
    description: 'archived Release description',
  },
}

export const publishedASAPRelease: ReleaseDocument = {
  _rev: 'publishedRev',
  _id: '_.releases.publishedRelease',
  _type: 'system.release',
  createdBy: '',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'published',
  name: 'publishedRelease',
  publishAt: '2023-10-10T09:00:00Z',
  metadata: {
    title: 'published Release',
    releaseType: 'asap',
    intendedPublishAt: '2023-10-10T09:00:00Z',
    description: 'archived Release description',
  },
}

export const activeUndecidedRelease: ReleaseDocument = {
  _rev: 'undecidedRev',
  _id: '_.releases.undecidedRelease',
  _type: 'system.release',
  createdBy: '',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'active',
  name: 'undecidedRelease',
  metadata: {
    title: 'undecided Release',
    releaseType: 'undecided',
    description: 'undecided Release description',
  },
}
