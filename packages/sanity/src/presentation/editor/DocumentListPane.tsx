import {Box, Card, Code, Flex, Label, Stack} from '@sanity/ui'
import {type ErrorInfo, useCallback, useEffect, useMemo, useState} from 'react'
import {getPublishedId, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {ErrorBoundary} from '../../ui-components'
import {ErrorCard} from '../components/ErrorCard'
import {presentationLocaleNamespace} from '../i18n'
import {
  type MainDocumentState,
  type PresentationNavigate,
  type PresentationSearchParams,
  type StructureDocumentPaneParams,
} from '../types'
import {usePresentationTool} from '../usePresentationTool'
import {DocumentRow} from './DocumentRow'

const Root = styled(Flex)`
  height: 100%;
`

const Scroller = styled(Box)`
  overflow-y: auto;
`

const WrappedCode = styled(Code)`
  white-space: pre-wrap;
`

/**
 * The "Documents on this page" sidebar list in the Presentation tool.
 *
 * `refs` arrives in DOM order from the overlay scan. We render rows
 * ourselves (one `<DocumentRow>` per ref) so the order is preserved.
 *
 * Previously this delegated to the structure tool's `<DocumentListPane>`,
 * which always applied a sort (DEFAULT_ORDERING `_updatedAt desc`, or a
 * user-persisted sort under the pane id `$root`). That dropped the DOM-order
 * signal and broke the contract users expect from this list.
 * See https://github.com/sanity-io/sanity/issues/12956.
 *
 * `onEditReference` and `onStructureParams` are kept on the props for API
 * compatibility — they are wired up by the parent for the structure-tool
 * route but unused in this list-of-rows rendering, where each row navigates
 * directly via `StateLink`.
 */
export function DocumentListPane(props: {
  mainDocumentState?: MainDocumentState
  onEditReference: PresentationNavigate
  onStructureParams: (params: StructureDocumentPaneParams) => void
  searchParams: PresentationSearchParams
  refs: {_id: string; _type: string}[]
}): React.JSX.Element {
  const {mainDocumentState, searchParams, refs} = props

  const {t} = useTranslation(presentationLocaleNamespace)
  const {devMode} = usePresentationTool()

  // Filter out the main document (shown separately above) and preserve the
  // input (DOM) order. Deduplicate by published id so the same document
  // referenced twice on the page doesn't render twice.
  const rows = useMemo(() => {
    const seen = new Set<string>()
    const result: {id: string; schemaTypeName: string}[] = []
    for (const ref of refs) {
      const id = getPublishedId(ref._id)
      if (id === mainDocumentState?.document?._id) continue
      if (seen.has(id)) continue
      seen.add(id)
      result.push({id, schemaTypeName: ref._type})
    }
    return result
  }, [mainDocumentState, refs])

  const [errorParams, setErrorParams] = useState<{
    info: ErrorInfo
    error: Error
  } | null>(null)

  const handleRetry = useCallback(() => setErrorParams(null), [])

  // Reset error state when `refs` value changes
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
      <Root direction="column" flex={1}>
        <Card paddingX={3} paddingY={2}>
          <Label muted size={0}>
            {t('document-list-pane.document-list.title')}
          </Label>
        </Card>
        <Scroller flex={1}>
          {rows.length > 0 && (
            <Stack as="ul" padding={2} space={1}>
              {rows.map((row) => (
                <Box as="li" key={row.id}>
                  <DocumentRow
                    id={row.id}
                    schemaTypeName={row.schemaTypeName}
                    searchParams={searchParams}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Scroller>
      </Root>
    </ErrorBoundary>
  )
}
