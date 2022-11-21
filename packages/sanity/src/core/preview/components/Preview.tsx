import React from 'react'
import {RenderPreviewCallbackProps} from '../../form/types'
import {usePreviewComponent} from '../../form/form-components-hooks'
import {PreviewLoader} from '../index'

/**
 * @internal
 */
export function Preview(props: RenderPreviewCallbackProps) {
  const PreviewComponent = usePreviewComponent()
  return <PreviewLoader {...props} component={PreviewComponent} />
}
