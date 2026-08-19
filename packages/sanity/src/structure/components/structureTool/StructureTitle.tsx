import {useEffect} from 'react'
import {useConstructDocumentTitle} from 'sanity'

import {LOADING_PANE} from '../../constants'
import {type Panes} from '../../structureResolvers/useResolvedPanes'
import {type DocumentPaneNode} from '../../types'

interface StructureTitleProps {
  resolvedPanes: Panes['resolvedPanes']
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
    // Otherwise, display a `document.title` containing the resolved Sanity document title, which will be imported from the document pane
    return null
  }

  // Otherwise, display the last pane's title (if present)
  return <PassthroughTitle title={lastPane?.title} />
}

// Type guards
function isDocumentPane(pane: Panes['resolvedPanes'][number]): pane is DocumentPaneNode {
  return pane !== LOADING_PANE && pane.type === 'document'
}

function isLoadingPane(pane: Panes['resolvedPanes'][number]): pane is typeof LOADING_PANE {
  return pane === LOADING_PANE
}
