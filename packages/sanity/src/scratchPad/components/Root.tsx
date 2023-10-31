import React, {useRef} from 'react'
import {PortableTextEditor} from '@sanity/portable-text-editor'
import {ScratchPadProvider} from '../context/ScratchPadProvider'
import ScratchPadLayout from './Layout'

export default function ScratchPadRoot() {
  const editorRef = useRef<PortableTextEditor | null>(null)
  const assistantPromptRef = useRef<HTMLTextAreaElement | null>(null)

  return (
    <ScratchPadProvider editorRef={editorRef} assistantPromptRef={assistantPromptRef}>
      <ScratchPadLayout />
    </ScratchPadProvider>
  )
}
