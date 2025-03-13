import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {type HTMLProps, useCallback, useMemo} from 'react'
import {
  getPreviewValueWithFallback,
  type Path,
  PreviewCard,
  SanityDefaultPreview,
  Translate,
  useSchema,
  useTranslation,
} from 'sanity'
import {StateLink} from 'sanity/router'

import {presentationLocaleNamespace} from '../i18n'
import {
  type MainDocumentState,
  type PresentationSearchParams,
  type StructureDocumentPaneParams,
} from '../types'
import {DocumentListPane} from './DocumentListPane'
import {DocumentPanel} from './DocumentPanel'
import usePreviewState from './usePreviewState'

export function ContentEditor(props: {
  documentId?: string
  documentType?: string
  mainDocumentState?: MainDocumentState
  onFocusPath: (path: Path) => void
  onStructureParams: (params: StructureDocumentPaneParams) => void
  refs: {_id: string; _type: string}[]
  structureParams: StructureDocumentPaneParams
  searchParams: PresentationSearchParams
}): React.JSX.Element {
  const {
    documentId,
    documentType,
    mainDocumentState,
    onFocusPath,
    onStructureParams,
    refs,
    searchParams,
    structureParams,
  } = props

  const {t} = useTranslation(presentationLocaleNamespace)
  const schema = useSchema()

  const MainDocumentLink = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (props: HTMLProps<HTMLAnchorElement>) => {
      return (
        <StateLink
          {...props}
          state={{
            id: mainDocumentState?.document?._id,
            type: mainDocumentState?.document?._type,
            _searchParams: Object.entries(searchParams),
          }}
        />
      )
    },
    [mainDocumentState, searchParams],
  )

  const schemaType = useMemo(
    () => schema.get(mainDocumentState?.document?._type || 'shoe')!,
    [mainDocumentState, schema],
  )

  const previewState = usePreviewState(mainDocumentState?.document?._id || '', schemaType)

  const preview = useMemo(() => {
    if (!mainDocumentState?.document) return null

    return (
      <SanityDefaultPreview
        {...getPreviewValueWithFallback({
          snapshot: previewState.snapshot,
          fallback: mainDocumentState!.document,
        })}
        schemaType={schemaType}
        status={
          <Card padding={1} radius={2} shadow={1}>
            <Text muted size={0} weight="medium">
              {t('main-document.label')}
            </Text>
          </Card>
        }
      />
    )
  }, [mainDocumentState, schemaType, t, previewState])

  if (documentId && documentType) {
    return (
      <DocumentPanel
        documentId={documentId}
        documentType={documentType}
        onFocusPath={onFocusPath}
        onStructureParams={onStructureParams}
        searchParams={searchParams}
        structureParams={structureParams}
      />
    )
  }

  return (
    <Flex direction="column" flex={1} height="fill">
      {mainDocumentState && (
        <Card padding={3} tone={mainDocumentState.document ? 'inherit' : 'caution'}>
          {mainDocumentState.document ? (
            <PreviewCard
              __unstable_focusRing
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              as={MainDocumentLink as any}
              data-as="a"
              radius={2}
              sizing="border"
              tone="inherit"
            >
              {preview}
            </PreviewCard>
          ) : (
            <Card padding={2} radius={2} tone="inherit">
              <Flex gap={3}>
                <Box flex="none">
                  <Text size={1}>
                    <WarningOutlineIcon />
                  </Text>
                </Box>
                <Box flex={1}>
                  <Text size={1}>
                    <Translate
                      t={t}
                      i18nKey="main-document.missing.text"
                      components={{Code: 'code'}}
                      values={{path: mainDocumentState.path}}
                    />
                  </Text>
                </Box>
              </Flex>
            </Card>
          )}
        </Card>
      )}

      <DocumentListPane
        mainDocumentState={mainDocumentState}
        onStructureParams={onStructureParams}
        searchParams={searchParams}
        refs={refs}
      />
    </Flex>
  )
}
