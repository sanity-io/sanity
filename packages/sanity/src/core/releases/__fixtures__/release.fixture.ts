import {type ReleaseDocument} from '../store/types'

export const activeScheduledRelease: ReleaseDocument = {
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
  _id: '_.releases.activeRelease',
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
