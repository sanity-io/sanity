/*  TEMPORARY  DUMMY DATA */

import {type BundleDocument} from '../../store/bundles/types'

export const LATEST: BundleDocument = {
  name: 'drafts',
  title: 'Latest',
  icon: undefined,
  tone: 'gray',
  publishAt: '',
  _type: 'bundle',
  authorId: '',
  _id: '',
  _createdAt: '',
  _updatedAt: '',
  _rev: '',
}

// dummy data
export const BUNDLES: BundleDocument[] = [
  LATEST,
  {
    name: 'previewDrafts',
    title: 'Preview drafts',
    icon: 'edit',
    tone: 'caution',
    publishAt: '',
    _type: 'bundle',
    authorId: '',
    _id: '',
    _createdAt: '',
    _updatedAt: '',
    _rev: '',
  },
  {
    name: 'published',
    title: 'Published',
    icon: 'eye-open',
    tone: 'primary',
    publishAt: '',
    _type: 'bundle',
    authorId: '',
    _id: '',
    _createdAt: '',
    _updatedAt: '',
    _rev: '',
  },
  {
    name: 'summerDrop',
    title: 'Summer Drop',
    icon: 'sun',
    tone: 'critical',
    publishAt: '',
    _type: 'bundle',
    authorId: '',
    _id: '',
    _createdAt: '',
    _updatedAt: '',
    _rev: '',
  },
  {
    name: 'autumnDrop',
    title: 'Autumn Drop',
    icon: 'star',
    tone: 'positive',
    publishAt: '',
    _type: 'bundle',
    authorId: '',
    _id: '',
    _createdAt: '',
    _updatedAt: '',
    _rev: '',
  },
]
