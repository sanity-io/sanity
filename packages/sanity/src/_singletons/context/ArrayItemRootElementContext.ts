import type {RefObject} from 'react'
import {createContext} from 'react'

/**
 * Holds a ref to the root DOM element of the closest array item wrapper.
 *
 * Inputs rendered inside an array item (e.g. reference inputs) use this to
 * treat interactions anywhere within the item — including UI rendered by
 * custom `item`/`input` form components around the default input — as
 * "inside" when handling outside clicks.
 *
 * @internal
 */
export const ArrayItemRootElementContext = createContext<RefObject<HTMLDivElement | null> | null>(
  null,
)
