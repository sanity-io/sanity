import {createContext} from 'react'
import {
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  RenderPreviewCallback,
} from '../types'

export interface FormRenderCallbacksContextValue {
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderItemCallback
  renderPreview: RenderPreviewCallback
}

export const FormRenderCallbacksContext = createContext<FormRenderCallbacksContextValue | null>(
  null
)
