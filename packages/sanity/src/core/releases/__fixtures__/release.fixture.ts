import {type ReleaseDocument} from '../store/types'

export const activeScheduledRelease: ReleaseDocument = {
  _id: '_.releases.activeRelease',
  _type: 'system.release',
  createdBy: '',
  _createdAt: '2023-10-01T08:00:00Z',
  _updatedAt: '2023-10-01T09:00:00Z',
  state: 'active',
  name: 'activeRelease',
  metadata: {
    title: 'active Release',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-01T10:00:00Z',
    description: 'active Release description',
  },
}
