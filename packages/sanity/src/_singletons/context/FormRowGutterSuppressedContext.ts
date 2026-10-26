import {createContext} from 'react'

/**
 * When true, the form row rendered directly inside skips the variant gutter.
 * `FormRow` resets this for its descendants, so nested rows keep the gutter.
 *
 * @internal
 */
export const FormRowGutterSuppressedContext = createContext(false)
