import {Path} from '@sanity/types'
import {ReportedRegion} from '../components/react-track-elements'
import {Session, Status, User} from '../datastores/presence/types'

export type Position = 'top' | 'bottom' | 'inside' | null
export type Size = 'xsmall' | 'small' | 'medium'

export type RegionWithIntersectionDetails = {
  distanceTop: number
  distanceBottom: number
  position: 'top' | 'bottom' | 'inside'
  region: ReportedRegion<FieldPresenceData>
}

export {ReportedRegion}

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
  path: Path
}

export interface FormFieldPresence {
  user: User
  path: Path
  sessionId: string
  lastActiveAt: string
}
