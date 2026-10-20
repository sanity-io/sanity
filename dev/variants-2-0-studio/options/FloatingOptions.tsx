import {
  type LayoutProps,
  PerspectiveMenuExtensionProvider,
  ShippedPerspectiveBarProvider,
  VariantDetailExtensionProvider,
  VariantEditNoticeProvider,
} from 'sanity'
import {DocumentListItemOverrideProvider, DocumentPaneExtensionProvider} from 'sanity/structure'

import {useOptionAExtension} from '../c1/Controls'
import {PerspectiveProvider} from '../c1/state'
import {useRowOverride} from '../c3/RowOverride'
import {EditNotice} from '../c6/EditNotice'
import {useVariantDetailOverride} from '../c6/useVariantDetailOverride'
import {DesignOptions} from '../design-options/DesignOptions'
import {RemoteListener} from '../journeys/RemoteListener'
import {useDocumentPaneOverride} from '../pane/useDocumentPaneOverride'
import {ResultToastStyles} from '../toasts/ResultToast'
import {ShapeStyles} from './ShapeStyles'
import {STOCK_OPTION, useOption} from './store'

/** C1 option C, and Stock, keep the shipped perspective bar; A and B replace it with the Variants 2.0 design. */
const useShowShippedBar = () => {
  const c1 = useOption('c1')
  return c1 === STOCK_OPTION || c1 === 'c'
}

/**
 * The studio's extension points take a HOOK as the provider's value (the PROPOSED seams in packages/sanity: the host decides per row or per
 * pane what to render, and the Studio calls the hook where it renders). Naming the hooks once, here at module scope and under plain names,
 * keeps the layout a plain component: it passes values, it never uses a hook as a value inside a render.
 */
const EXTENSIONS = {
  rowOverride: useRowOverride,
  perspectiveMenu: useOptionAExtension,
  showShippedBar: useShowShippedBar,
  variantDetail: useVariantDetailOverride,
  documentPane: useDocumentPaneOverride,
}

export function LayoutWithFloatingOptions(props: LayoutProps) {
  return (
    <DocumentListItemOverrideProvider value={EXTENSIONS.rowOverride}>
      <PerspectiveProvider>
        <PerspectiveMenuExtensionProvider value={EXTENSIONS.perspectiveMenu}>
          <ShippedPerspectiveBarProvider value={EXTENSIONS.showShippedBar}>
            <VariantEditNoticeProvider value={EditNotice}>
              <VariantDetailExtensionProvider value={EXTENSIONS.variantDetail}>
                <DocumentPaneExtensionProvider value={EXTENSIONS.documentPane}>
                  {props.renderDefault(props)}
                  <DesignOptions />
                  <RemoteListener />
                  <ShapeStyles />
                  <ResultToastStyles />
                </DocumentPaneExtensionProvider>
              </VariantDetailExtensionProvider>
            </VariantEditNoticeProvider>
          </ShippedPerspectiveBarProvider>
        </PerspectiveMenuExtensionProvider>
      </PerspectiveProvider>
    </DocumentListItemOverrideProvider>
  )
}
