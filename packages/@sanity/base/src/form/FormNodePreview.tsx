import React, {useMemo} from 'react'
import {FormPreviewProps, FIXME} from './types'
import {useFormBuilder} from './useFormBuilder'
import {PreviewAny} from './utils/fallback-preview/PreviewAny'

/**
 * @internal
 *
 * TODO: rename to `FormValuePreview` or `ValuePreview` ???
 */
export function FormNodePreview(props: FormPreviewProps) {
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
