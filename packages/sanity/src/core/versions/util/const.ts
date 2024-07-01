/*  TEMPORARY  DUMMY DATA */

import {type IconSymbol} from '@sanity/icons'
import {type ButtonTone} from '@sanity/ui'

import {type Version} from '../types'

export const RANDOM_TONES: ButtonTone[] = ['default', 'caution', 'critical', 'positive', 'primary']
export const RANDOM_SYMBOLS: IconSymbol[] = [
  'archive',
  'edit',
  'eye-open',
  'heart',
  'info-filled',
  'circle',
  'search',
  'sun',
  'star',
  'trash',
  'user',
]

export const LATEST: Version = {
  name: 'drafts',
  title: 'Latest',
  icon: undefined,
  tone: 'default',
  publishAt: 0,
}

// dummy data
export const BUNDLES: Version[] = [
  LATEST,
  {name: 'previewDrafts', title: 'Preview drafts', icon: 'edit', tone: 'caution', publishAt: 0},
  {name: 'published', title: 'Published', icon: 'eye-open', tone: 'primary', publishAt: 0},
  {name: 'summerDrop', title: 'Summer Drop', icon: 'sun', tone: 'critical', publishAt: 0},
  {name: 'autumnDrop', title: 'Autumn Drop', icon: 'star', tone: 'positive', publishAt: 0},
]
