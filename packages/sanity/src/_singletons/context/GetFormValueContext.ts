import type {Path} from '@sanity/types'
import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 * @hidden
 */
export type GetFormValueContextValue = (path: Path) => unknown

/**
 * @internal
 */
export const GetFormValueContext: Context<GetFormValueContextValue | null> =
  createContext<GetFormValueContextValue | null>('sanity/_singletons/context/get-form-value', null)
