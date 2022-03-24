import {FormPreviewProps} from '@sanity/base/form'
import React, {useMemo} from 'react'
import {FIXME} from './types'
import {useFormBuilder} from './useFormBuilder'
import {PreviewAny} from './utils/fallback-preview/PreviewAny'

export function Preview(props: FormPreviewProps) {
  const {type, value} = props
  const {resolvePreviewComponent} = useFormBuilder()

  const PreviewComponent = useMemo(
    () => resolvePreviewComponent(type),
    [resolvePreviewComponent, type]
  )

  if (PreviewComponent) {
    return <PreviewComponent {...props} />
  }

  return (
    <div title="Unable to resolve preview component. Using fallback.">
      <PreviewAny value={value as FIXME} maxDepth={2} />
    </div>
  )
}
