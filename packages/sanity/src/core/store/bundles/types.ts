import {type ListenEvent} from '@sanity/client'
import {type IconSymbol} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {type ButtonTone} from '@sanity/ui'
import {type Observable} from 'rxjs'

export interface BundleDocument extends SanityDocument {
  _type: 'bundle'
  title: string
  name: string
  description?: string
  tone?: ButtonTone
  icon?: IconSymbol
  authorId: string
  publishedAt?: string
}

export interface BundlesStore {
  initialFetch: () => Observable<BundleDocument[] | null>
  listener: () => Observable<ListenEvent<Record<string, BundleDocument | null>>>
}
