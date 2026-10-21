import {type ReactNode} from 'react'
import {
  type LayoutProps,
  FieldSetRollupProvider,
  NavbarNeutralProvider,
  PerspectiveMenuExtensionProvider,
  ShippedPerspectiveBarProvider,
  VariantDetailExtensionProvider,
  VariantEditNoticeProvider,
  VariantFilterAddControlProvider,
} from 'sanity'
import {
  DocumentListItemOverrideProvider,
  DocumentPaneExtensionProvider,
  VariantBannerReplacedProvider,
} from 'sanity/structure'

import {useOptionAExtension} from '../c1/Controls'
import {renderPickerAddFilter} from '../c1/PickerAddFilter'
import {PerspectiveProvider} from '../c1/state'
import {useRowOverride} from '../c3/RowOverride'
import {EditNotice} from '../c6/EditNotice'
import {useVariantDetailOverride} from '../c6/useVariantDetailOverride'
import {DesignOptions} from '../design-options/DesignOptions'
import {renderFieldSetRollup} from '../fieldmarks/E9Marks'
import {RemoteListener} from '../journeys/RemoteListener'
import {useDocumentPaneOverride} from '../pane/useDocumentPaneOverride'
import {ResultToastStyles} from '../toasts/ResultToast'
import {MarkStyles} from './MarkStyles'
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
  showShippedBar: useShowShippedBar,
  variantDetail: useVariantDetailOverride,
  documentPane: useDocumentPaneOverride,
}

/** The perspective menu's extension is a value: this calls the hook that builds it (it reads the perspective state) and provides the result. */
function PerspectiveMenuHost({children}: {children: ReactNode}) {
  const extension = useOptionAExtension()
  return (
    <PerspectiveMenuExtensionProvider value={extension}>
      {children}
    </PerspectiveMenuExtensionProvider>
  )
}

/** C1 B (the open beta design): the navbar keeps the default tone, so the state is said by the controls, not by a green or coloured bar. */
function NeutralNavbarHost({children}: {children: ReactNode}) {
  const neutral = useOption('c1') === 'b'
  return <NavbarNeutralProvider value={neutral}>{children}</NavbarNeutralProvider>
}

export function LayoutWithFloatingOptions(props: LayoutProps) {
  // The Variants tool's Add filter uses the perspective bar's picker; Stock keeps the shipped menu.
  const stock = useOption('c1') === STOCK_OPTION
  // Our missing-variant banner (C7 A or B) replaces the stock one: one banner, not two.
  const c7 = useOption('c7')
  return (
    <VariantBannerReplacedProvider value={c7 === 'a' || c7 === 'b'}>
      <DocumentListItemOverrideProvider value={EXTENSIONS.rowOverride}>
        <PerspectiveProvider>
          <PerspectiveMenuHost>
            <NeutralNavbarHost>
              <ShippedPerspectiveBarProvider value={EXTENSIONS.showShippedBar}>
                <VariantEditNoticeProvider value={EditNotice}>
                  <VariantDetailExtensionProvider value={EXTENSIONS.variantDetail}>
                    <DocumentPaneExtensionProvider value={EXTENSIONS.documentPane}>
                      <VariantFilterAddControlProvider value={stock ? null : renderPickerAddFilter}>
                        <FieldSetRollupProvider value={renderFieldSetRollup}>
                          {props.renderDefault(props)}
                        </FieldSetRollupProvider>
                      </VariantFilterAddControlProvider>
                      <DesignOptions />
                      <RemoteListener />
                      <ShapeStyles />
                      <MarkStyles />
                      <ResultToastStyles />
                    </DocumentPaneExtensionProvider>
                  </VariantDetailExtensionProvider>
                </VariantEditNoticeProvider>
              </ShippedPerspectiveBarProvider>
            </NeutralNavbarHost>
          </PerspectiveMenuHost>
        </PerspectiveProvider>
      </DocumentListItemOverrideProvider>
    </VariantBannerReplacedProvider>
  )
}
