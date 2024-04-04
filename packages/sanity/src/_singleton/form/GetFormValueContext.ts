import {type Path} from '@sanity/types'
import {createContext} from 'react'

/**
 * @internal
 * @hidden
 */
export type GetFormValueContextValue = (path: Path) => unknown

export const GetFormValueContext = createContext<GetFormValueContextValue | null>(null)
