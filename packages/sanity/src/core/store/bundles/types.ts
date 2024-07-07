import {type IconSymbol} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {type ButtonTone} from '@sanity/ui'
import {type Dispatch} from 'react'
import {type Observable} from 'rxjs'

import {type bundlesReducerAction, type bundlesReducerState} from './reducer'

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
  state$: Observable<bundlesReducerState>
  dispatch: Dispatch<bundlesReducerAction>
}
