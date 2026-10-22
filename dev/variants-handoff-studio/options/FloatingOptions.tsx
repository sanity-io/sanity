import {type ReactNode, useMemo} from 'react'
import {
  type LayoutProps,
  NavbarNeutralProvider,
  PerspectiveMenuExtensionProvider,
  ShippedPerspectiveBarProvider,
  VariantFilterAddControlProvider,
} from 'sanity'
import {DocumentPaneExtensionProvider, VariantBannerReplacedProvider} from 'sanity/structure'

import {useOptionAExtension} from '../c1/Controls'
import {isLockedNav} from '../c1/lockedNav'
import {renderPickerAddFilter} from '../c1/PickerAddFilter'
import {PerspectiveProvider} from '../c1/state'
import {
  resolveDocumentPaneOverride,
  useDocumentPaneOverrideState,
} from '../c2/useDocumentPaneOverride'
import {STOCK_OPTION, useOption} from './store'

/** C1 option C, and Stock, keep the shipped perspective bar; the Handoff Studio is fixed on C1 B, so it never shows. */
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
  showShippedBar: useShowShippedBar,
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
  const neutral = isLockedNav(useOption('c1'))
  return <NavbarNeutralProvider value={neutral}>{children}</NavbarNeutralProvider>
}

/** The pane extension (C2 pills): built from the studio-wide state, one function for every pane. */
function DocumentPaneHost({children}: {children: ReactNode}) {
  const state = useDocumentPaneOverrideState()
  const resolve = useMemo(() => resolveDocumentPaneOverride(state), [state])
  // T6: the pane's variant banners are ours (c7/OpenBetaBanner.tsx), so the stock "not in variant" and "variant not found" banners step aside.
  return (
    <VariantBannerReplacedProvider value>
      <DocumentPaneExtensionProvider value={resolve}>{children}</DocumentPaneExtensionProvider>
    </VariantBannerReplacedProvider>
  )
}

/** The Handoff Studio's layout: the open beta seams only. There is no Design options window and no remote. */
export function LayoutWithFloatingOptions(props: LayoutProps) {
  return (
    // T3: the list rows keep core's status dots as shipped; only what the dots' hover shows changed, in core (22 Oct call).
    <>
      {/* The Versions pill is the way into the inventory (T2), so the footer's stock "Manage versions" button (core, no seam) is hidden. */}
      <style>{`[data-testid="action-document-group-inventory"] {display: none !important}`}</style>
      <PerspectiveProvider>
        <PerspectiveMenuHost>
          <NeutralNavbarHost>
            <ShippedPerspectiveBarProvider value={EXTENSIONS.showShippedBar}>
              <DocumentPaneHost>
                <VariantFilterAddControlProvider value={renderPickerAddFilter}>
                  {props.renderDefault(props)}
                </VariantFilterAddControlProvider>
              </DocumentPaneHost>
            </ShippedPerspectiveBarProvider>
          </NeutralNavbarHost>
        </PerspectiveMenuHost>
      </PerspectiveProvider>
    </>
  )
}
