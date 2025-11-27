import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {CommentsUpsellContextValue} from '../../core/comments/context/upsell/types'

/**
 * @internal
 */
export const CommentsUpsellContext: Context<CommentsUpsellContextValue | null> =
  createContext<CommentsUpsellContextValue | null>(
    'sanity/_singletons/context/comments-upsell',
    null,
  )
