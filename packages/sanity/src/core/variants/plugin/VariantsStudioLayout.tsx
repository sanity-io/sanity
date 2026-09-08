import {type LayoutProps} from '../../config/studio/types'
import {PerspectiveActiveDocumentProvider} from '../../perspective/activeDocument/PerspectiveActiveDocumentProvider'

/**
 * Mounts the active-document provider above both the navbar and the active tool,
 * which is the only place a navbar component and a pane component can meet.
 *
 * Needs no `enabled` check: `getDefaultPlugins` filters the whole variants plugin
 * out when `beta.variants.enabled` is false, so this override does not exist in
 * that configuration.
 *
 * @internal
 */
export function VariantsStudioLayout(props: LayoutProps): React.JSX.Element {
  return (
    <PerspectiveActiveDocumentProvider>
      {props.renderDefault(props)}
    </PerspectiveActiveDocumentProvider>
  )
}
