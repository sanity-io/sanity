// export type Position = 'top' | 'bottom' | 'inside' | null
// export type Size = 'xsmall' | 'small' | 'medium'

export type RegionWithIntersectionDetails = {
  distanceTop: number
  distanceBottom: number
  position: 'top' | 'bottom' | 'inside'
  region: Region
}

export type Region = {
  id: string
  data: Data
  rect: {
    top: number
    left: number
    height: number
    width: number
  }
  component: React.ComponentType<Data>
  spacerHeight?: number
}

type Data = {
  presence: FormFieldPresence[]
  maxAvatars: number
  avatarComponent: React.ComponentType
}

export type Status = 'online' | 'editing' | 'inactive'
export type PathElement = string | number | {_key: string}

export interface User {
  id: string
  displayName?: string
  imageUrl?: string
}

export type PresentUser = {
  user: User
  status?: Status
  sessions?: Session[]
}

export interface Session {
  id: string
  locations: Location[]
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

// (this is what each client typically exchanges over bifur)
export interface PresenceLocation {
  type: 'document'
  documentId: string
  path: PathElement[]
  data: PresenceData
  lastActiveAt: string
}

type PresenceData = {[key: string]: any}

export type GlobalPresenceItem = {
  user: User
  status: Status
  lastActiveAt: string
  locations: PresenceLocation[]
}
