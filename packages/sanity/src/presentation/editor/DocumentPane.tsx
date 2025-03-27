import {studioPath} from '@sanity/client/csm'
import {Card, Code, Label, Stack} from '@sanity/ui'
import {type ErrorInfo, Suspense, useCallback, useEffect, useMemo, useState} from 'react'
import {type Path, useTranslation} from 'sanity'
import {decodeJsonParams} from 'sanity/router'
import {
  DocumentPane as StructureDocumentPane,
  type DocumentPaneNode,
  PaneLayout,
} from 'sanity/structure'
import {styled} from 'styled-components'

import {ErrorBoundary} from '../../ui-components'
import {ErrorCard} from '../components/ErrorCard'
import {presentationLocaleNamespace} from '../i18n'
import {PresentationPaneRouterProvider} from '../paneRouter/PresentationPaneRouterProvider'
import {PresentationSpinner} from '../PresentationSpinner'
import {
  type PresentationNavigate,
  type PresentationSearchParams,
  type PresentationStateParams,
  type StructureDocumentPaneParams,
} from '../types'
import {usePresentationTool} from '../usePresentationTool'

const WrappedCode = styled(Code)`
  white-space: pre-wrap;
`

export function DocumentPane(props: {
  documentId: string
  documentType: string
  onFocusPath: (state: Required<PresentationStateParams>) => void
  onEditReference: PresentationNavigate
  onStructureParams: (params: StructureDocumentPaneParams) => void
  structureParams: StructureDocumentPaneParams
  searchParams: PresentationSearchParams
}): React.JSX.Element {
  const {
    documentId,
    documentType,
    onFocusPath,
    onEditReference,
    onStructureParams,
    searchParams,
    structureParams,
  } = props
  const {template, templateParams} = structureParams

  const {t} = useTranslation(presentationLocaleNamespace)
  const {devMode} = usePresentationTool()

  const paneDocumentNode: DocumentPaneNode = useMemo(
    () => ({
      id: documentId,
      options: {
        id: documentId,
        type: documentType,
        template,
        templateParameters: decodeJsonParams(templateParams),
      },
      title: '',
      type: 'document',
    }),
    [documentId, documentType, template, templateParams],
  )

  const handleFocusPath = useCallback(
    (path: Path) => {
      return onFocusPath({
        id: documentId,
        type: documentType,
        path: studioPath.toString(path),
      })
    },
    [documentId, documentType, onFocusPath],
  )

  const [errorParams, setErrorParams] = useState<{
    info: ErrorInfo
    error: Error
  } | null>(null)

  const handleRetry = useCallback(() => setErrorParams(null), [])

  // Reset error state when parameters change
  useEffect(() => {
    setErrorParams(null)
  }, [documentId, documentType, structureParams])

  if (errorParams) {
    return (
      <ErrorCard flex={1} message={t('document-pane.error.text')} onRetry={handleRetry}>
        {devMode && (
          // show runtime error message in dev mode
          <Card overflow="auto" padding={3} radius={2} tone="critical">
            <Stack gap={3}>
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
      <PaneLayout style={{height: '100%'}}>
        <PresentationPaneRouterProvider
          searchParams={searchParams}
          onEditReference={onEditReference}
          onStructureParams={onStructureParams}
          structureParams={structureParams}
        >
          <Suspense fallback={<PresentationSpinner />}>
            <StructureDocumentPane
              // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
              paneKey="document"
              index={1}
              itemId="document"
              pane={paneDocumentNode}
              onFocusPath={handleFocusPath}
            />
          </Suspense>
        </PresentationPaneRouterProvider>
      </PaneLayout>
    </ErrorBoundary>
  )
}
