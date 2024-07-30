import type {Path} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 * @hidden
 */
export type GetFormValueContextValue = (path: Path) => unknown

/**
 * @internal
 */
export const GetFormValueContext = createContext<GetFormValueContextValue | null>(
  'sanity/_singletons/context/get-form-value',
  null,
)
