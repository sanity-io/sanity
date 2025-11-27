import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export type SingleDocReleaseEnabledContextValue =
  | {enabled: false; mode: null}
  | {enabled: true; mode: 'default' | 'upsell'}

const DEFAULT: SingleDocReleaseEnabledContextValue = {
  enabled: false,
  mode: null,
}

/**
 * @internal
 */
export const SingleDocReleaseEnabledContext: Context<SingleDocReleaseEnabledContextValue> =
  createContext<SingleDocReleaseEnabledContextValue>(
    'sanity/_singletons/context/single-doc-release-enabled',
    DEFAULT,
  )
