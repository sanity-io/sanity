import {usePreviewComponent} from '../../form/form-components-hooks'
import {type RenderPreviewCallbackProps} from '../../form/types'
import {PreviewLoader} from '../index'

/**
 * @internal
 */
export function Preview(props: RenderPreviewCallbackProps) {
  const PreviewComponent = usePreviewComponent()
  return <PreviewLoader {...props} component={PreviewComponent} />
}
