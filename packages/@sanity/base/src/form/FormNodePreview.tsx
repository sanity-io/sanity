import React, {useMemo} from 'react'
import {PreviewProps} from '../components/previews'
import {FIXME} from './types'
import {useFormBuilder} from './useFormBuilder'
import {PreviewAny} from './utils/fallback-preview/PreviewAny'

/**
 * @internal
 *
 * TODO: rename to `FormValuePreview` or `ValuePreview` ???
 */
export function FormNodePreview(
  props: PreviewProps<string> & Required<Pick<PreviewProps, 'type'>>
) {
  const {type, value} = props
  const {resolvePreviewComponent} = useFormBuilder().__internal

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
