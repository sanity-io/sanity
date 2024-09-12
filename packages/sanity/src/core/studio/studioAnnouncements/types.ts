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
