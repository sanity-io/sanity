import {PathElement, Session, Status, User} from '../datastores/presence/types'

export type Position = 'top' | 'bottom' | 'inside' | null
export type Size = 'xsmall' | 'small' | 'medium'

export type RegionWithIntersectionDetails = {
  distanceTop: number
  distanceBottom: number
  position: 'top' | 'bottom' | 'inside'
  region: Region
}

export type Region = {
  id: string
  data: FieldPresenceData
  rect: {
    top: number
    left: number
    height: number
    width: number
  }
  component: React.ComponentType<FieldPresenceData>
  spacerHeight?: number
}

export type FieldPresenceData = {
  presence: FormFieldPresence[]
  maxAvatars: number
  avatarComponent: React.ComponentType
}

export type PresentUser = {
  user: User
  status?: Status
  sessions?: Session[]
}

export interface Location {
  documentId: string
  path: PathElement[]
}

export interface FormFieldPresence {
  user: User
  path: PathElement[]
  sessionId: string
  lastActiveAt: string
}
