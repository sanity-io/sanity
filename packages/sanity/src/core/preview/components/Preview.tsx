import {usePreviewComponent} from '../../form/form-components-hooks/usePreviewComponent'
import {type RenderPreviewCallbackProps} from '../../form/types/renderCallback'
import {type PerspectiveStack} from '../../perspective/types'
import {PreviewLoader} from './PreviewLoader'

/**
 * @internal
 */
export function Preview(
  props: RenderPreviewCallbackProps & {perspectiveStack?: PerspectiveStack; variant?: string},
) {
  const PreviewComponent = usePreviewComponent()
  return <PreviewLoader {...props} component={PreviewComponent} />
}
