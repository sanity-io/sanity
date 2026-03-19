import {usePreviewComponent} from '../../form/form-components-hooks/componentHooks'
import type {RenderPreviewCallbackProps} from '../../form/types/renderCallback'
import {type PerspectiveStack} from '../../perspective/types'
import {PreviewLoader} from './PreviewLoader'

/**
 * @internal
 */
export function Preview(props: RenderPreviewCallbackProps & {perspectiveStack?: PerspectiveStack}) {
  const PreviewComponent = usePreviewComponent()
  return <PreviewLoader {...props} component={PreviewComponent} />
}
