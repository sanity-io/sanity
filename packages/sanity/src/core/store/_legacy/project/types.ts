import {type Role} from '@sanity/types'
import {type Observable} from 'rxjs'

/**
 * @hidden
 * @beta */
export interface ProjectData {
  id: string
  displayName: string
  /**
   * @deprecated Use the `/user-applications` endpoint instead, which lists all deployed studios/applications
   * @see https://www.sanity.io/help/studio-host-user-applications
   */
  studioHost: string | null
  isBlocked: boolean
  isDisabled: boolean
  isDisabledByUser: boolean
  metadata: {
    color: string
    /**
     * @deprecated Use the `/user-applications` endpoint instead, which lists all deployed studios/applications
     * @see https://www.sanity.io/help/studio-host-user-applications
     */
    externalStudioHost: string
  }
  maxRetentionDays: number
  activityFeedEnabled: boolean
  createdAt: string
  updatedAt: string
  organizationId: string
  members: {
    id: string
    createdAt: string
    updatedAt: string
    isCurrentUser: boolean
    isRobot: boolean
    role: string
    roles: Role[]
  }[]
  features: string[]
  pendingInvites: number
}

/**
 * @hidden
 * @beta */
export interface ProjectDatasetData {
  name: string
  aclMode: 'public' | 'private'
  createdAt: string
  createdByUserId: string
  tags: {
    name: string
    title: string
  }[]
}

/**
 * @hidden
 * @beta */
export interface ProjectStore {
  get: () => Observable<ProjectData>
  getDatasets: () => Observable<ProjectDatasetData[]>
}
