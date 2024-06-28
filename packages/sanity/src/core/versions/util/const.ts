/*  TEMPORARY  DUMMY DATA */

import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'

import {type Version} from '../types'

export const RANDOM_TONES: ColorHueKey[] = [
  'green',
  'yellow',
  'red',
  'purple',
  'blue',
  'cyan',
  'magenta',
  'orange',
]
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
  name: 'draft',
  title: 'Latest',
  icon: undefined,
  hue: undefined,
  publishAt: 0,
}

// dummy data
export const BUNDLES: Version[] = [
  LATEST,
  {name: 'previewDrafts', title: 'Preview drafts', icon: 'edit', hue: 'yellow', publishAt: 0},
  {name: 'published', title: 'Published', icon: 'eye-open', hue: 'blue', publishAt: 0},
  {name: 'summerDrop', title: 'Summer Drop', icon: 'sun', hue: 'orange', publishAt: 0},
  {name: 'autumnDrop', title: 'Autumn Drop', icon: 'star', hue: 'red', publishAt: 0},
]
