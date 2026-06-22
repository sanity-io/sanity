import {Card, Code, Flex, Label, Stack} from '@sanity/ui'
import {type ErrorInfo, useCallback, useEffect, useMemo, useState} from 'react'
import {getPublishedId, useTranslation} from 'sanity'
import {
  DocumentListPane as StructureDocumentListPane,
  ORDER_BY_IDS_PARAM_FIELD,
  PaneLayout,
  type PaneNode,
  StructureToolProvider,
} from 'sanity/structure'
import {styled} from 'styled-components'

import {ErrorBoundary} from '../../ui-components'
import {ErrorCard} from '../components/ErrorCard'
import {presentationLocaleNamespace} from '../i18n'
import {PresentationPaneRouterProvider} from '../paneRouter/PresentationPaneRouterProvider'
import {
  type MainDocumentState,
  type PresentationNavigate,
  type PresentationSearchParams,
  type StructureDocumentPaneParams,
} from '../types'
import {usePresentationTool} from '../usePresentationTool'

const RootLayout = styled(PaneLayout)`
  height: 100%;
`

const Root = styled(Flex)`
  & > div {
    min-width: none !important;
    max-width: none !important;
  }
`

const WrappedCode = styled(Code)`
  white-space: pre-wrap;
`

/**
 * Visual page order seeds the list; `refs` then appends any documents visual
 * editing did not report. `refs` ids are normalised to published ids (they carry
 * draft/version variants); `visualOrderPublishedIds` already are.
 */
export function deriveOrderedIds({
  visualOrderPublishedIds,
  refs,
  mainDocumentId,
}: {
  visualOrderPublishedIds: string[]
  refs: {_id: string; _type: string}[]
  mainDocumentId?: string
}): string[] {
  const seenPublishedIds = new Set<string>()
  const candidatePublishedIds = [
    ...visualOrderPublishedIds,
    ...refs.map((ref) => getPublishedId(ref._id)),
  ]

  return candidatePublishedIds.reduce<string[]>((accumulatedIds, publishedId) => {
    if (publishedId === mainDocumentId || seenPublishedIds.has(publishedId)) {
      return accumulatedIds
    }
    seenPublishedIds.add(publishedId)
    accumulatedIds.push(publishedId)
    return accumulatedIds
  }, [])
}

export function DocumentListPane(props: {
  mainDocumentState?: MainDocumentState
  onEditReference: PresentationNavigate
  onStructureParams: (params: StructureDocumentPaneParams) => void
  searchParams: PresentationSearchParams
  refs: {_id: string; _type: string}[]
  visualOrderPublishedIds: string[]
}): React.JSX.Element {
  const {
    mainDocumentState,
    onEditReference,
    onStructureParams,
    searchParams,
    refs,
    visualOrderPublishedIds,
  } = props

  const {t} = useTranslation(presentationLocaleNamespace)
  const {devMode} = usePresentationTool()

  const ids = useMemo(
    () =>
      deriveOrderedIds({
        visualOrderPublishedIds,
        refs,
        mainDocumentId: mainDocumentState?.document?._id,
      }),
    [mainDocumentState, refs, visualOrderPublishedIds],
  )

  const pane: Extract<PaneNode, {type: 'documentList'}> = useMemo(
    () => ({
      id: 'presentationDocumentsOnPage',
      options: {
        filter: '_id in $ids',
        params: {ids},
        defaultOrdering: [{field: ORDER_BY_IDS_PARAM_FIELD, direction: 'asc'}],
      },
      schemaTypeName: '',
      title: t('document-list-pane.document-list.title'),
      type: 'documentList',
      menuItemGroups: [{id: 'sorting'}],
      menuItems: [
        {
          group: 'sorting',
          action: 'setSortOrder',
          i18n: {
            title: {
              key: 'document-list-pane.ordering.by-appearance',
              ns: presentationLocaleNamespace,
            },
          },
          title: 'By appearance',
          params: {by: [{field: ORDER_BY_IDS_PARAM_FIELD, direction: 'asc'}]},
        },
        {
          group: 'sorting',
          action: 'setSortOrder',
          i18n: {
            title: {
              key: 'document-list-pane.ordering.last-edited',
              ns: presentationLocaleNamespace,
            },
          },
          title: 'Last edited',
          params: {by: [{field: '_updatedAt', direction: 'desc'}]},
        },
      ],
      suppressRestoreDefaultMenuItems: true,
    }),
    // Pane id drives the keyvalue persistence key (global across pages). Avoid
    // `$` — the keyvalue store rejects it as a key segment.
    [ids, t],
  )

  const [errorParams, setErrorParams] = useState<{
    info: ErrorInfo
    error: Error
  } | null>(null)

  const handleRetry = useCallback(() => setErrorParams(null), [])

  const [structureParams] = useState(() => ({}))

  // Reset error state when `refs` value changes
  // oxlint-disable-next-line react/react-compiler
  useEffect(() => setErrorParams(null), [refs])

  if (errorParams) {
    return (
      <ErrorCard flex={1} message={t('document-list-pane.error.text')} onRetry={handleRetry}>
        {devMode && (
          // show runtime error message in dev mode
          <Card overflow="auto" padding={3} radius={2} tone="critical">
            <Stack space={3}>
              <Label muted size={0}>
                {t('presentation-error.label')}
              </Label>
              <WrappedCode size={1}>{errorParams.error.message}</WrappedCode>
            </Stack>
          </Card>
        )}
      </ErrorCard>
    )
  }

  return (
    <ErrorBoundary onCatch={setErrorParams}>
      <RootLayout>
        <StructureToolProvider>
          <PresentationPaneRouterProvider
            onEditReference={onEditReference}
            onStructureParams={onStructureParams}
            structureParams={structureParams}
            searchParams={searchParams}
            refs={refs}
          >
            <Root direction="column" flex={1}>
              <StructureDocumentListPane
                index={0}
                itemId="$root"
                pane={pane}
                // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
                paneKey="$root"
              />
            </Root>
          </PresentationPaneRouterProvider>
        </StructureToolProvider>
      </RootLayout>
    </ErrorBoundary>
  )
}
