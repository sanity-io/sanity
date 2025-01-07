import {type Path, type SanityDocument} from '@sanity/types'
import {
  BoundaryElementProvider,
  Card,
  Container as UiContainer,
  DialogProvider,
  PortalProvider,
} from '@sanity/ui'
import {noop} from 'lodash'
import {
  type CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ChangeIndicatorsTracker,
  createPatchChannel,
  FormBuilder,
  getPublishedId,
  getVersionFromId,
  isDraftId,
  isPublishedId,
  isVersionId,
  LoadingBlock,
  useDocumentForm,
  useEditState,
  VirtualizerScrollInstanceProvider,
} from 'sanity'
import {ConnectorContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {usePathSyncChannel} from '../hooks/usePathSyncChannel'
import {type PathSyncChannel} from '../types/pathSyncChannel'
import {Scroller} from './Scroller'

const DiffViewPaneLayout = styled(Card)`
  position: relative;
  grid-area: var(--grid-area);
`

const Container = styled(UiContainer)`
  width: auto;
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
  const containerElement = useRef<HTMLDivElement | null>(null)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)
  const compareValue = useCompareValue({compareDocument})
  const [patchChannel] = useState(() => createPatchChannel())

  const {
    formState,
    onChange,
    onFocus,
    onBlur,
    onSetActiveFieldGroup,
    onSetCollapsedFieldSet,
    onSetCollapsedPath,
    collapsedFieldSets,
    ready,
    collapsedPaths,
    schemaType,
    value,
    onProgrammaticFocus,
    ...documentForm
  } = useDocumentForm({
    documentId: getPublishedId(documentId),
    documentType,
    selectedPerspectiveName: perspectiveName(documentId),
    releaseId: getVersionFromId(documentId),
    comparisonValue: compareValue,
  })

  const isLoading = formState === null || !ready

  const pathSyncChannel = usePathSyncChannel({
    id: role,
    syncChannel,
  })

  const onPathOpen = useCallback(
    (path: Path) => {
      documentForm.onPathOpen(path)
      pathSyncChannel.push({source: role, path})
    },
    [documentForm, pathSyncChannel, role],
  )

  useEffect(() => {
    const subscription = pathSyncChannel.path.subscribe((path) => onProgrammaticFocus(path))
    return () => subscription.unsubscribe()
  }, [onProgrammaticFocus, pathSyncChannel.path])

  return (
    <ConnectorContext.Provider
      value={{
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
                <PortalProvider element={portalElement}>
                  <DialogProvider position="absolute">
                    {isLoading ? (
                      <LoadingBlock showText />
                    ) : (
                      <Container ref={containerElement} padding={4} width={1}>
                        <FormBuilder
                          // eslint-disable-next-line camelcase
                          __internal_patchChannel={patchChannel}
                          id={`diffView-pane-${role}`}
                          onChange={onChange}
                          onPathFocus={onFocus}
                          onPathOpen={onPathOpen}
                          onPathBlur={onBlur}
                          onFieldGroupSelect={onSetActiveFieldGroup}
                          onSetFieldSetCollapsed={onSetCollapsedFieldSet}
                          onSetPathCollapsed={onSetCollapsedPath}
                          collapsedPaths={collapsedPaths}
                          collapsedFieldSets={collapsedFieldSets}
                          focusPath={formState.focusPath}
                          changed={formState.changed}
                          focused={formState.focused}
                          groups={formState.groups}
                          validation={formState.validation}
                          members={formState.members}
                          presence={formState.presence}
                          schemaType={schemaType}
                          value={value}
                        />
                      </Container>
                    )}
                  </DialogProvider>
                </PortalProvider>
              </Scroller>
              <div data-testid="diffView-document-panel-portal" ref={setPortalElement} />
            </DiffViewPaneLayout>
          </BoundaryElementProvider>
        </VirtualizerScrollInstanceProvider>
      </ChangeIndicatorsTracker>
    </ConnectorContext.Provider>
  )
})

function perspectiveName(documentId: string): string | undefined {
  if (isVersionId(documentId)) {
    return getVersionFromId(documentId)
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
