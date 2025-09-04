import {usePreviewComponent} from '../../form/form-components-hooks'
import {type RenderPreviewCallbackProps} from '../../form/types'
import {type PerspectiveStack} from '../../perspective/types'
import {PreviewLoader} from '../index'

/**
 * @internal
 */
export function Preview(props: RenderPreviewCallbackProps & {perspectiveStack?: PerspectiveStack}) {
  const PreviewComponent = usePreviewComponent()
  return <PreviewLoader {...props} component={PreviewComponent} />
}
