import {type LayoutProps, PerspectiveMenuExtensionProvider} from 'sanity'
import {DocumentListItemOverrideProvider, DocumentPaneExtensionProvider} from 'sanity/structure'

import {PerspectiveProvider} from '../c1/state'
import {useOptionAExtension} from '../c1/Controls'
import {useRowOverride} from '../c3/RowOverride'
import {DesignOptions} from '../design-options/DesignOptions'
import {JourneysPanel} from '../journeys/JourneysPanel'
import {useDocumentPaneOverride} from '../pane/useDocumentPaneOverride'

export function LayoutWithFloatingOptions(props: LayoutProps) {
  return (
    <DocumentListItemOverrideProvider value={useRowOverride}>
      <PerspectiveProvider>
        <PerspectiveMenuExtensionProvider value={useOptionAExtension}>
          <DocumentPaneExtensionProvider value={useDocumentPaneOverride}>
            {props.renderDefault(props)}
            <DesignOptions />
            <JourneysPanel />
          </DocumentPaneExtensionProvider>
        </PerspectiveMenuExtensionProvider>
      </PerspectiveProvider>
    </DocumentListItemOverrideProvider>
  )
}
