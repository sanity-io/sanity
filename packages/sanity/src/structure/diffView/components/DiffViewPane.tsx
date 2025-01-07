import {type ReleaseId} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {BoundaryElementProvider, Box, Card, DialogProvider, PortalProvider} from '@sanity/ui'
import {noop} from 'lodash'
import {type CSSProperties, forwardRef, useMemo, useRef, useState} from 'react'
import {
  ChangeIndicatorsTracker,
  getPublishedId,
  getVersionFromId,
  isDraftId,
  isPublishedId,
  isReleaseId,
  isVersionId,
  PerspectiveProvider,
  useEditState,
  VirtualizerScrollInstanceProvider,
} from 'sanity'
import {ConnectorContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {DocumentPaneProvider, FormViewComponent} from '../..'
import {type PathSyncChannel} from '../types/pathSyncChannel'
import {PathSyncChannelSubscriber} from './PathSyncChannelSubscriber'
import {Scroller} from './Scroller'

const DiffViewPaneLayout = styled(Card)`
  position: relative;
  grid-area: var(--grid-area);
`

interface DiffViewPaneProps {
  documentType: string
  documentId: string
  role: 'previous' | 'next'
  scrollElement: HTMLElement | null
  syncChannel: PathSyncChannel
  compareDocument: {
    type: string
    id: string
  }
}

export const DiffViewPane = forwardRef<HTMLDivElement, DiffViewPaneProps>(function DiffViewPane(
  {role, documentType, documentId, scrollElement, syncChannel, compareDocument},
  ref,
) {
  const paneId = ['diffView', role].join('.')
  const publishedVersionId = getPublishedId(documentId)
  const containerElement = useRef<HTMLDivElement | null>(null)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)
  const compareValue = useCompareValue({compareDocument})

  return (
    <ConnectorContext.Provider
      value={{
        // Only display change indicators in the next document pane.
        isEnabled: role === 'next',
        // Render the change indicators inertly, because the diff view modal does not currently
        // provide a way to display document inspectors.
        isInteractive: false,
        onOpenReviewChanges: noop,
        onSetFocus: noop,
        isReviewChangesOpen: false,
      }}
    >
      <ChangeIndicatorsTracker>
        <VirtualizerScrollInstanceProvider
          scrollElement={scrollElement}
          containerElement={containerElement}
        >
          <BoundaryElementProvider element={boundaryElement}>
            <DiffViewPaneLayout
              ref={setBoundaryElement}
              style={
                {
                  '--grid-area': `${role}-document`,
                } as CSSProperties
              }
              borderLeft={role === 'next'}
            >
              <Scroller
                ref={ref}
                style={
                  {
                    // The scroll position is synchronised between panes. This style hides the
                    // scrollbar for all panes except the one displaying the next document.
                    '--scrollbar-width': role !== 'next' && 'none',
                  } as CSSProperties
                }
              >
                <PerspectiveProvider
                  selectedPerspectiveName={perspectiveName(documentId)}
                  excludedPerspectives={[]}
                >
                  <DocumentPaneProvider
                    index={0}
                    paneKey={paneId}
                    itemId={paneId}
                    pane={{
                      id: paneId,
                      type: 'document',
                      // Providing a falsey value allows the title to be computed automatically based
                      // on the document's values.
                      title: '',
                      options: {
                        type: documentType,
                        id: publishedVersionId,
                      },
                    }}
                    compareValue={compareValue}
                  >
                    <PortalProvider element={portalElement}>
                      <DialogProvider position="absolute">
                        <PathSyncChannelSubscriber id={role} syncChannel={syncChannel} />
                        <Box ref={containerElement}>
                          <FormViewComponent hidden={false} margins={[0, 0, 0, 0]} />
                        </Box>
                      </DialogProvider>
                    </PortalProvider>
                  </DocumentPaneProvider>
                </PerspectiveProvider>
              </Scroller>
              <div data-testid="diffView-document-panel-portal" ref={setPortalElement} />
            </DiffViewPaneLayout>
          </BoundaryElementProvider>
        </VirtualizerScrollInstanceProvider>
      </ChangeIndicatorsTracker>
    </ConnectorContext.Provider>
  )
})

function perspectiveName(documentId: string): 'published' | ReleaseId | undefined {
  const version = getVersionFromId(documentId)

  if (isReleaseId(version)) {
    return version
  }

  if (isPublishedId(documentId)) {
    return 'published'
  }

  return undefined
}

type UseCompareValueOptions = Pick<DiffViewPaneProps, 'compareDocument'>

/**
 * Fetch the contents of `compareDocument` for comparison with another version of the document.
 */
function useCompareValue({compareDocument}: UseCompareValueOptions): SanityDocument | undefined {
  const compareDocumentEditState = useEditState(
    getPublishedId(compareDocument.id),
    compareDocument.type,
    'low',
    getVersionFromId(compareDocument.id),
  )

  return useMemo(() => {
    if (isVersionId(compareDocument.id)) {
      return compareDocumentEditState.version ?? undefined
    }

    if (isDraftId(compareDocument.id)) {
      return compareDocumentEditState.draft ?? undefined
    }

    if (isPublishedId(compareDocument.id)) {
      return compareDocumentEditState.published ?? undefined
    }

    return undefined
  }, [
    compareDocument.id,
    compareDocumentEditState.draft,
    compareDocumentEditState.published,
    compareDocumentEditState.version,
  ])
}
