import {type Path, type SanityDocument} from '@sanity/types'
import {
  BoundaryElementProvider,
  Card,
  Container as UiContainer,
  DialogProvider,
  PortalProvider,
} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {
  type ComponentType,
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefAttributes,
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
  PerspectiveProvider,
  type TargetPerspective,
  useActiveReleases,
  useDocumentForm,
  useEditState,
  useMiddlewareComponents,
  VirtualizerScrollInstanceProvider,
} from 'sanity'
import {CommentsEnabledContext, ReviewChangesContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {pickDocumentLayoutComponent} from '../../panes/document/document-layout/pickDocumentLayoutComponent'
import {usePathSyncChannel} from '../hooks/usePathSyncChannel'
import {type PathSyncChannel} from '../types/pathSyncChannel'
import {findRelease} from '../utils/findRelease'
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

export function DiffViewPane({
  ref,
  role,
  documentType,
  documentId,
  scrollElement,
  syncChannel,
  compareDocument,
}: DiffViewPaneProps & RefAttributes<HTMLDivElement>) {
  const containerElement = useRef<HTMLDivElement | null>(null)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)

  const DocumentLayout = useMiddlewareComponents({
    pick: pickDocumentLayoutComponent,
    defaultComponent: useCallback(
      () => (
        <DiffViewDocument
          compareDocument={compareDocument}
          documentId={documentId}
          documentType={documentType}
          role={role}
          scrollElement={scrollElement}
          syncChannel={syncChannel}
        />
      ),
      [compareDocument, documentId, documentType, role, scrollElement, syncChannel],
    ),
  })

  return (
    <ReviewChangesContext.Provider
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
              style={{
                '--grid-area': `${role}-document`,
              }}
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
                    <Container ref={containerElement} padding={4} width={1}>
                      {/* Each pane renders exactly the document its URL id points at — a variant
                          version id carries its opaque scope in the id itself — so the globally
                          selected perspective and variant must not leak into the pane's form.
                          Scope the perspective to the pane's own bundle, with no variant
                          selected. */}
                      <PerspectiveProvider selectedPerspectiveName={perspectiveName(documentId)}>
                        {/* oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work */}
                        <DocumentLayout documentId={documentId} documentType={documentType} />
                      </PerspectiveProvider>
                    </Container>
                  </DialogProvider>
                </PortalProvider>
              </Scroller>
              <div data-testid="diffView-document-panel-portal" ref={setPortalElement} />
            </DiffViewPaneLayout>
          </BoundaryElementProvider>
        </VirtualizerScrollInstanceProvider>
      </ChangeIndicatorsTracker>
    </ReviewChangesContext.Provider>
  )
}

const DiffViewDocument: ComponentType<DiffViewPaneProps> = ({
  role,
  documentType,
  documentId,
  syncChannel,
  compareDocument,
}) => {
  const compareValue = useCompareValue({compareDocument})
  const {data: releases} = useActiveReleases()
  const [patchChannel] = useState(() => createPatchChannel())
  const perspective = useMemo(() => findRelease(documentId, releases), [documentId, releases])

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
    openPath,
    onPathOpen: onPathOpenFromForm,
  } = useDocumentForm({
    documentId: getPublishedId(documentId),
    documentType,
    selectedPerspectiveName: perspectiveName(documentId),
    releaseId: getVersionFromId(documentId),
    comparisonValue: compareValue,
    displayInlineChanges: true,
  })

  const isLoading = formState === null || !ready

  const pathSyncChannel = usePathSyncChannel({
    id: role,
    syncChannel,
  })

  const onPathOpen = useCallback(
    (path: Path) => {
      onPathOpenFromForm(path)
      pathSyncChannel.push({source: role, path})
    },
    [onPathOpenFromForm, pathSyncChannel, role],
  )

  useEffect(() => {
    const subscription = pathSyncChannel.path.subscribe((path) => {
      onPathOpenFromForm(path)
      onProgrammaticFocus(path)
    })
    return () => subscription.unsubscribe()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [onPathOpenFromForm, onProgrammaticFocus, pathSyncChannel.path, role])

  return isLoading ? (
    <LoadingBlock showText />
  ) : (
    <CommentsEnabledContext.Provider
      value={{
        enabled: false,
        mode: null,
      }}
    >
      <FormBuilder
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
        openPath={openPath}
        changed={formState.changed}
        focused={formState.focused}
        groups={formState.groups}
        validation={formState.validation}
        members={formState.members}
        perspective={sanitizeBundleName(perspective)}
        hasUpstreamVersion={formState.hasUpstreamVersion}
        changedFromBaseVariant={formState.changedFromBaseVariant}
        baseVariantValue={formState.baseVariantValue}
        hasBaseVariant={formState.hasBaseVariant}
        presence={formState.presence}
        schemaType={schemaType}
        value={value}
        compareValue={compareValue}
      />
    </CommentsEnabledContext.Provider>
  )
}

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
  // No `getTargetScopeId(useTargetDocumentState())` here: the version is derived from the specific
  // compare-document id being diffed, not from the selected perspective.
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

// TODO: Refactor `findRelease` to return a type compatible with `TargetPerspective` (`"draft"` must be `"drafts"`), so that `sanitizeBundleName` can be removed.
function sanitizeBundleName(bundle: ReturnType<typeof findRelease>): TargetPerspective | undefined {
  if (bundle === 'draft') {
    return 'drafts'
  }

  return bundle
}
