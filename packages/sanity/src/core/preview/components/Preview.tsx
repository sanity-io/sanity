import {usePreviewComponent} from '../../form/form-components-hooks/componentHooks'
import type {RenderPreviewCallbackProps} from '../../form/types/renderCallback'
import {PreviewLoader} from '../components/PreviewLoader'

/**
 * @internal
 */
export function Preview(props: RenderPreviewCallbackProps) {
  const PreviewComponent = usePreviewComponent()
  return <PreviewLoader {...props} component={PreviewComponent} />
}
