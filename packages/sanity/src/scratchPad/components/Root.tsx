import React, {useMemo, useRef} from 'react'
import {PortableTextEditor} from '@sanity/portable-text-editor'
import {ScratchPadProvider} from '../context/ScratchPadProvider'
import {DocumentPaneNode, DocumentPaneProvider, DeskToolProvider} from '../../desk'
import {documentType} from '../config'
import ScratchPadLayout from './Layout'

export default function ScratchPadRoot() {
  const editorRef = useRef<PortableTextEditor | null>(null)
  const assistantPromptRef = useRef<HTMLTextAreaElement | null>(null)
  const documentId = 'test'

  const pane: DocumentPaneNode = useMemo(
    () => ({
      id: documentId,
      options: {
        id: documentId,
        type: documentType.name,
      },
      type: 'document',
      title: 'ScratchPad Document',
    }),
    [documentId],
  )

  return (
    <DeskToolProvider>
      <DocumentPaneProvider paneKey={'scratchPadPane'} index={0} itemId={''} pane={pane}>
        <ScratchPadProvider editorRef={editorRef} assistantPromptRef={assistantPromptRef}>
          <ScratchPadLayout />
        </ScratchPadProvider>
      </DocumentPaneProvider>
    </DeskToolProvider>
  )
}
