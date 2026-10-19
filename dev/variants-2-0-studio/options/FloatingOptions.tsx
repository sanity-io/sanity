import {type LayoutProps, PerspectiveMenuExtensionProvider, VariantDetailExtensionProvider} from 'sanity'
import {DocumentListItemOverrideProvider, DocumentPaneExtensionProvider} from 'sanity/structure'

import {PerspectiveProvider} from '../c1/state'
import {useOptionAExtension} from '../c1/Controls'
import {useRowOverride} from '../c3/RowOverride'
import {useVariantDetailOverride} from '../c6/useVariantDetailOverride'
import {DesignOptions} from '../design-options/DesignOptions'
import {JourneysPanel} from '../journeys/JourneysPanel'
import {useDocumentPaneOverride} from '../pane/useDocumentPaneOverride'

export function LayoutWithFloatingOptions(props: LayoutProps) {
  return (
    <DocumentListItemOverrideProvider value={useRowOverride}>
      <PerspectiveProvider>
        <PerspectiveMenuExtensionProvider value={useOptionAExtension}>
          <VariantDetailExtensionProvider value={useVariantDetailOverride}>
          <DocumentPaneExtensionProvider value={useDocumentPaneOverride}>
            {props.renderDefault(props)}
            <DesignOptions />
            <JourneysPanel />
          </DocumentPaneExtensionProvider>
          </VariantDetailExtensionProvider>
        </PerspectiveMenuExtensionProvider>
      </PerspectiveProvider>
    </DocumentListItemOverrideProvider>
  )
}
