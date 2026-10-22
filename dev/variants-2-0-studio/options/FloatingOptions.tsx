import {type ReactNode, useMemo} from 'react'
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
import {hasNavSection, isLockedNav} from '../c1/lockedNav'
import {renderPickerAddFilter} from '../c1/PickerAddFilter'
import {PerspectiveProvider} from '../c1/state'
import {useNavbarSection} from '../c1/useNavbarSection'
import {useRowOverride} from '../c3/RowOverride'
import {EditNotice} from '../c6/EditNotice'
import {useVariantDetailOverride} from '../c6/useVariantDetailOverride'
import {AddressPickerHost} from '../c10/AddressPicker'
import {DesignOptions} from '../design-options/DesignOptions'
import {renderFieldSetRollup} from '../fieldmarks/E9Marks'
import {ChromeStyles} from '../pane/ChromeStyles'
import {
  resolveDocumentPaneOverride,
  useDocumentPaneOverrideState,
} from '../pane/useDocumentPaneOverride'
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
}

/** The perspective menu's extension is a value: this calls the hook that builds it (it reads the perspective state) and provides the result. */
function PerspectiveMenuHost({children}: {children: ReactNode}) {
  const base = useOptionAExtension()
  const c1 = useOption('c1')
  // D: the state control is one button; E keeps the stock split control.
  const section = useNavbarSection(c1 === 'd')
  // C1 B (the open beta navbar): the global perspective is one grey section.
  const extension = useMemo(
    // The base is empty for the open beta navbar now (core owns the menu's search), so the section stands on its own.
    () => (hasNavSection(c1) ? {...base, section} : base),
    [base, section, c1],
  )
  return (
    <PerspectiveMenuExtensionProvider value={extension}>
      {children}
    </PerspectiveMenuExtensionProvider>
  )
}

/** C1 B (the open beta design): the navbar keeps the default tone, so the state is said by the controls, not by a green or coloured bar. */
function NeutralNavbarHost({children}: {children: ReactNode}) {
  const neutral = isLockedNav(useOption('c1'))
  return <NavbarNeutralProvider value={neutral}>{children}</NavbarNeutralProvider>
}

/** The pane extension (C2 pills, C7 banners, the compact header): built from the studio-wide state, one function for every pane. */
function DocumentPaneHost({children}: {children: ReactNode}) {
  const state = useDocumentPaneOverrideState()
  const resolve = useMemo(() => resolveDocumentPaneOverride(state), [state])
  return <DocumentPaneExtensionProvider value={resolve}>{children}</DocumentPaneExtensionProvider>
}

export function LayoutWithFloatingOptions(props: LayoutProps) {
  // The Variants tool's Add filter uses the perspective bar's picker; Stock keeps the shipped menu.
  const stock = useOption('c1') === STOCK_OPTION
  // Our missing-variant banner (C7 A, B or D) replaces the stock ones: one banner, not two.
  const c7 = useOption('c7')
  return (
    <VariantBannerReplacedProvider value={c7 === 'a' || c7 === 'b' || c7 === 'd'}>
      <DocumentListItemOverrideProvider value={EXTENSIONS.rowOverride}>
        <PerspectiveProvider>
          <PerspectiveMenuHost>
            <NeutralNavbarHost>
              <ShippedPerspectiveBarProvider value={EXTENSIONS.showShippedBar}>
                <VariantEditNoticeProvider value={EditNotice}>
                  <VariantDetailExtensionProvider value={EXTENSIONS.variantDetail}>
                    <DocumentPaneHost>
                      <VariantFilterAddControlProvider value={stock ? null : renderPickerAddFilter}>
                        <FieldSetRollupProvider value={renderFieldSetRollup}>
                          {props.renderDefault(props)}
                        </FieldSetRollupProvider>
                      </VariantFilterAddControlProvider>
                      <DesignOptions />
                      {/* C10 B: the address picker beside the navbar and list pane "+" type lists (nothing on A). */}
                      <AddressPickerHost />
                      <ShapeStyles />
                      <MarkStyles />
                      <ChromeStyles />
                      <ResultToastStyles />
                    </DocumentPaneHost>
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
