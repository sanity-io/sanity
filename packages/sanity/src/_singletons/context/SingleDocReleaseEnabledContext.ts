import {createContext} from 'react'

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
export const SingleDocReleaseEnabledContext =
  createContext<SingleDocReleaseEnabledContextValue>(DEFAULT)
