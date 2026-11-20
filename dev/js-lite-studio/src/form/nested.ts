/** The form's input, for the inputs that render other inputs inside them (array items, Portable
 * Text objects), which the form in turn renders. */
import {createContext, type ReactNode, use} from 'react'

import {type Resolved} from '../schema'
import {type Target} from './target'

export interface InputProps {
  target: Target
  resolved: Resolved
  level: number
}

export type RenderInput = (props: InputProps) => ReactNode

export const InputContext = createContext<RenderInput | null>(null)

export function useRenderInput(): RenderInput {
  const renderInput = use(InputContext)
  if (!renderInput) throw new Error('An input that nests inputs must render inside the form fields')
  return renderInput
}
