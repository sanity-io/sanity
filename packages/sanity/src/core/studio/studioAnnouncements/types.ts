import {type PortableTextBlock} from '@sanity/types'

export const audienceRoles = [
  'administrator',
  'editor',
  'viewer',
  'contributor',
  'developer',
  'custom',
] as const

export type AudienceRole = (typeof audienceRoles)[number]

export interface StudioAnnouncementDocument {
  _id: string
  _type: 'productAnnouncement'
  _rev: string
  _createdAt: string
  _updatedAt: string
  title: string
  name: string
  body: PortableTextBlock[]
  announcementType: 'whats-new'
  publishedDate: string
  expiryDate?: string
  audience:
    | 'everyone'
    | 'specific-version'
    | 'greater-than-or-equal-version'
    | 'less-than-or-equal-version'
  audienceRole?: AudienceRole[] | undefined
  studioVersion?: string
  preHeader: string
}

export interface StudioAnnouncementsContextValue {
  studioAnnouncements: StudioAnnouncementDocument[]
  unseenAnnouncements: StudioAnnouncementDocument[]
  onDialogOpen: (mode: DialogMode) => void
}

// Decides weather to show all the announcements or only the unseen ones
export type DialogMode = 'card' | 'help_menu'
