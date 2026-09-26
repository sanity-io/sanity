import {MasterDetailIcon} from '@sanity/icons/MasterDetail'
import {useContext, useMemo} from 'react'
import {
  type DocumentFieldActionGroup,
  type DocumentFieldActionItem,
  type DocumentFieldActionProps,
  type Tool,
  useWorkspace,
} from 'sanity'
import {PresentationContext} from 'sanity/_singletons'
import {useRouter} from 'sanity/router'

import {defineDocumentFieldAction} from '../../core/config/document/fieldActions/define'
import {pathToString} from '../../core/field/paths/helpers'
import {isRecord} from '../../core/util/isRecord'
import {DEFAULT_TOOL_NAME} from '../constants'

function useOpenInStructureAction(
  props: DocumentFieldActionProps,
): DocumentFieldActionItem | DocumentFieldActionGroup {
  const {documentId, documentType, path} = props
  const workspace = useWorkspace()
  const {navigateIntent} = useRouter()
  const presentation = useContext(PresentationContext)

  const defaultStructureTool = useMemo(
    () =>
      findStructureTool(
        workspace.tools,
        documentId,
        documentType,
        presentation?.name || DEFAULT_TOOL_NAME,
      ),
    [documentId, documentType, workspace.tools, presentation],
  )

  return {
    type: 'action',
    hidden: !presentation || path.length > 0 || !defaultStructureTool,
    icon: defaultStructureTool?.icon || MasterDetailIcon,
    title: `Open in ${defaultStructureTool?.title || 'Structure'}`,
    onAction() {
      navigateIntent('edit', {
        id: documentId,
        type: documentType,
        mode: 'structure',
        path: pathToString(path),
      })
    },
    renderAsButton: true,
  }
}

export const openInStructure = defineDocumentFieldAction({
  name: 'presentation/openInStructure',
  useAction: useOpenInStructureAction,
})

function findStructureTool(
  tools: Tool[],
  documentId: string,
  documentType: string,
  presentationToolName?: string,
): Tool | undefined {
  const results = tools
    .filter((t) => t.name !== presentationToolName)
    .map((t) => {
      const match = t.canHandleIntent?.(
        'edit',
        {
          id: documentId,
          type: documentType,
          mode: 'structure',
        },
        {},
      )

      return {tool: t, match}
    })

  const modeMatches = results.filter((t) => isRecord(t.match) && t.match.mode)

  if (modeMatches.length > 0) {
    return modeMatches[0].tool
  }

  const matches = results.filter((t) => t.match)

  return matches[0]?.tool
}
