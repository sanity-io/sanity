import PropTypes from 'prop-types'
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
export default function Preview(props: PreviewProps) {
  // static contextTypes = {
  //   formBuilder: PropTypes.object,
  // }

  // render() {
  const {type, value} = props
  const {resolvePreviewComponent} = useFormBuilder()

  const PreviewComponent = useMemo(() => resolvePreviewComponent(type), [type])

  // const PreviewComponent = context.formBuilder.resolvePreviewComponent(type)

  if (PreviewComponent) {
    return <PreviewComponent {...props} />
  }

  return (
    <div title="Unable to resolve preview component. Using fallback.">
      <PreviewAny value={value} maxDepth={2} />
    </div>
  )
}
