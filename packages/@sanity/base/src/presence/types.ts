import React from 'react'

import {User} from '../datastores/user'

export type Status = 'online' | 'editing' | 'inactive'

export type PathElement = string | number | {_key: string}

type LastActiveAt = string // iso date

// Low level data/transport format
export interface Session {
  id?: string
  sessionId: string
  userId: string
  lastActiveAt: LastActiveAt
  locations: PresenceLocation[]
}

// (this is what each client typically exchanges over bifur)
export interface PresenceLocation {
  type: 'document'
  documentId: string
  path: PathElement[]
  data?: Record<string, any>
  lastActiveAt: LastActiveAt
}

// These are the data prepared and made ready for different types of UI components to use
// Presence data prepared for a single document
export interface DocumentPresence {
  user: User
  path: PathElement[]
  lastActiveAt: LastActiveAt
}

export interface UserSessionPair {
  user: User
  session: Session
}

export interface GlobalPresence {
  user: User
  lastActiveAt: LastActiveAt
  locations: PresenceLocation[]
}

//////////////////////////////

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

export type GlobalPresenceItem = {
  user: User
  status: Status
  lastActiveAt: string
  locations: PresenceLocation[]
}
