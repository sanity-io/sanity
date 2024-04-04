import {type Path} from '@sanity/types'
import {createContext} from 'react'

/**
 * @internal
 * @hidden
 */
export type GetFormValueContextValue = (path: Path) => unknown

/**
 * @internal
 * @hidden
 */
export const GetFormValueContext = createContext<GetFormValueContextValue | null>(null)
