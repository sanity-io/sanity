import {type PortableTextBlock} from 'sanity'

export interface StudioAnnouncementDocument {
  _id: string
  _type: 'inAppCommunication'
  _rev: string
  _createdAt: string
  _updatedAt: string
  title: string
  body: PortableTextBlock[]
  announcementType: 'whats-new'
  publishedDate: string
  expiryDate?: string
  audience: 'everyone' | 'specific-version' | 'above-version' | 'below-version'
  studioVersion?: string
}

export interface StudioAnnouncementsContextValue {
  studioAnnouncements: StudioAnnouncementDocument[]
  unseenDocuments: StudioAnnouncementDocument[]
  onDialogOpen: (mode: DialogMode) => void
}

// Decides weather to show all the announcements or only the unseen ones
export type DialogMode = 'unseen' | 'all'
