import {type ObjectSchemaType} from '@sanity/types'
import {useEffect} from 'react'
import {
  unstable_useValuePreview as useValuePreview,
  useEditState,
  usePerspective,
  useSchema,
  useTranslation,
} from 'sanity'

import {LOADING_PANE} from '../../constants'
import {structureLocaleNamespace} from '../../i18n'
import {type Panes} from '../../structureResolvers'
import {type DocumentPaneNode} from '../../types'
import {useStructureTool} from '../../useStructureTool'

interface StructureTitleProps {
  resolvedPanes: Panes['resolvedPanes']
}

// TODO: Fix state jank when editing different versions inside panes.
const DocumentTitle = (props: {documentId: string; documentType: string}) => {
  const {documentId, documentType} = props
  const {selectedReleaseId} = usePerspective()

  const editState = useEditState(documentId, documentType, 'default', selectedReleaseId)
  const schema = useSchema()
  const {t} = useTranslation(structureLocaleNamespace)
  const isNewDocument = !editState?.published && !editState?.draft
  const documentValue = editState?.version || editState?.draft || editState?.published
  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined

  const {value, isLoading: previewValueIsLoading} = useValuePreview({
    enabled: true,
    schemaType,
    value: documentValue,
  })

  const documentTitle = isNewDocument
    ? t('browser-document-title.new-document', {
        schemaType: schemaType?.title || schemaType?.name,
      })
    : value?.title || t('browser-document-title.untitled-document')

  const settled = editState.ready && !previewValueIsLoading
  const newTitle = useConstructDocumentTitle(documentTitle)
  useEffect(() => {
    if (!settled) return
    // Set the title as the document title
    document.title = newTitle
  }, [documentTitle, settled, newTitle])

  return null
}

const PassthroughTitle = (props: {title?: string}) => {
  const {title} = props
  const newTitle = useConstructDocumentTitle(title)
  useEffect(() => {
    // Set the title as the document title
    document.title = newTitle
  }, [newTitle, title])
  return null
}

export const StructureTitle = (props: StructureTitleProps) => {
  const {resolvedPanes} = props

  if (!resolvedPanes?.length) return null

  const lastPane = resolvedPanes[resolvedPanes.length - 1]

  // If the last pane is loading, display the structure tool title only
  if (isLoadingPane(lastPane)) {
    return <PassthroughTitle />
  }

  // If the last pane is a document
  if (isDocumentPane(lastPane)) {
    // Passthrough the document pane's title, which may be defined in structure builder
    if (lastPane?.title) {
      return <PassthroughTitle title={lastPane.title} />
    }

    // Otherwise, display a `document.title` containing the resolved Sanity document title
    return <DocumentTitle documentId={lastPane.options.id} documentType={lastPane.options.type} />
  }

  // Otherwise, display the last pane's title (if present)
  return <PassthroughTitle title={lastPane?.title} />
}

/**
 * Construct a pipe delimited title containing `activeTitle` (if applicable) and the base structure title.
 *
 * @param activeTitle - Title of the first segment
 *
 * @returns A pipe delimited title in the format `${activeTitle} | %BASE_STRUCTURE_TITLE%`
 * or simply `%BASE_STRUCTURE_TITLE` if `activeTitle` is undefined.
 */
function useConstructDocumentTitle(activeTitle?: string) {
  const structureToolBaseTitle = useStructureTool().structureContext.title
  return [activeTitle, structureToolBaseTitle].filter((title) => title).join(' | ')
}

// Type guards
function isDocumentPane(pane: Panes['resolvedPanes'][number]): pane is DocumentPaneNode {
  return pane !== LOADING_PANE && pane.type === 'document'
}

function isLoadingPane(pane: Panes['resolvedPanes'][number]): pane is typeof LOADING_PANE {
  return pane === LOADING_PANE
}
