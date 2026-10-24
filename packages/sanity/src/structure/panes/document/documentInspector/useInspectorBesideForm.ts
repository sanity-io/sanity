import {usePaneLayout} from '../../../components/pane/usePaneLayout'
import {useStructureTool} from '../../../useStructureTool'
import {DOCUMENT_PANEL_WITH_INSPECTOR_MIN_WIDTH} from '../constants'

/**
 * Whether the document inspector renders beside the form (`true`) or in place of it (`false`).
 *
 * With `responsiveInspector` on, the decision is made from the width of the pane layout, which
 * must hold the document pane alone: its width is what the pane can take, and it does not depend
 * on the minimum width the pane asks for while an inspector is open.
 *
 * @internal
 */
export function useInspectorBesideForm(): boolean {
  const {features} = useStructureTool()
  const {collapsed, rootWidth} = usePaneLayout()

  if (!features.responsiveInspector) return features.resizablePanes
  if (collapsed) return false
  // The layout stays transparent until it has been measured
  if (rootWidth === undefined) return true

  return rootWidth >= DOCUMENT_PANEL_WITH_INSPECTOR_MIN_WIDTH
}
