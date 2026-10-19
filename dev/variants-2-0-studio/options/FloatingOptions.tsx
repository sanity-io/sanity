import {type LayoutProps, PerspectiveMenuExtensionProvider, ShippedPerspectiveBarProvider, VariantDetailExtensionProvider} from 'sanity'
import {DocumentListItemOverrideProvider, DocumentPaneExtensionProvider} from 'sanity/structure'

import {PerspectiveProvider} from '../c1/state'
import {useOptionAExtension} from '../c1/Controls'
import {useRowOverride} from '../c3/RowOverride'
import {useVariantDetailOverride} from '../c6/useVariantDetailOverride'
import {DesignOptions} from '../design-options/DesignOptions'
import {JourneysPanel} from '../journeys/JourneysPanel'
import {useDocumentPaneOverride} from '../pane/useDocumentPaneOverride'
import {STOCK_OPTION, useOption} from './store'

/** C1 option C, and Stock, keep the shipped perspective bar; A and B replace it with the Variants 2.0 design. */
const useShowShippedBar = () => {
  const c1 = useOption('c1')
  return c1 === STOCK_OPTION || c1 === 'c'
}

export function LayoutWithFloatingOptions(props: LayoutProps) {
  return (
    <DocumentListItemOverrideProvider value={useRowOverride}>
      <PerspectiveProvider>
        <PerspectiveMenuExtensionProvider value={useOptionAExtension}>
          <ShippedPerspectiveBarProvider value={useShowShippedBar}>
          <VariantDetailExtensionProvider value={useVariantDetailOverride}>
          <DocumentPaneExtensionProvider value={useDocumentPaneOverride}>
            {props.renderDefault(props)}
            <DesignOptions />
            <JourneysPanel />
          </DocumentPaneExtensionProvider>
          </VariantDetailExtensionProvider>
          </ShippedPerspectiveBarProvider>
        </PerspectiveMenuExtensionProvider>
      </PerspectiveProvider>
    </DocumentListItemOverrideProvider>
  )
}
