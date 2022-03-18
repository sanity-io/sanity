import React, {useMemo} from 'react'
import {useFormBuilder} from './useFormBuilder'
import {PreviewAny} from './utils/fallback-preview/PreviewAny'

type PreviewProps = {
  actions?: React.ReactNode
  layout?: string
  value?: any
  type: any
  fallbackTitle?: React.ReactNode
  withRadius?: boolean
  withBorder?: boolean
}

export function Preview(props: PreviewProps) {
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
      <PreviewAny value={value} maxDepth={2} />
    </div>
  )
}
