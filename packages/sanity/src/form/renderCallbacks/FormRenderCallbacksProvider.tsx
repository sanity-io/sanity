import React, {ReactNode, useContext, useMemo} from 'react'
import {
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  RenderPreviewCallback,
} from '../types'
import {
  FormRenderCallbacksContext,
  FormRenderCallbacksContextValue,
} from './FormRenderCallbacksContext'

export function FormRenderCallbacksProvider(props: {
  children?: ReactNode
  renderField?: RenderFieldCallback
  renderInput?: RenderInputCallback
  renderItem?: RenderItemCallback
  renderPreview?: RenderPreviewCallback
}) {
  const {children, renderField, renderInput, renderItem, renderPreview} = props
  const parent = useContext(FormRenderCallbacksContext)

  const renderCallbacks: FormRenderCallbacksContextValue = useMemo(
    () => ({
      renderField: renderField || parent?.renderField || (() => null),
      renderInput: renderInput || parent?.renderInput || (() => null),
      renderItem: renderItem || parent?.renderItem || (() => null),
      renderPreview: renderPreview || parent?.renderPreview || (() => null),
    }),
    [parent, renderField, renderInput, renderItem, renderPreview]
  )

  return (
    <FormRenderCallbacksContext.Provider value={renderCallbacks}>
      {children}
    </FormRenderCallbacksContext.Provider>
  )
}
