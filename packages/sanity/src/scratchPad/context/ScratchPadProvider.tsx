import {EditorSelection, PortableTextEditor} from '@sanity/portable-text-editor'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {PortableTextBlock, SanityDocument} from '@sanity/types'
import {PatchChannel, createPatchChannel} from '../../core'

export interface ScratchPadContextValue {
  assistanceFragment: PortableTextBlock[] | undefined
  assistanceSelection: EditorSelection
  assistantPromptRef: React.MutableRefObject<HTMLTextAreaElement | null>
  closeEditorToolbarMenu: () => void
  document: SanityDocument
  editorFocused: boolean
  editorRef: React.MutableRefObject<PortableTextEditor | null>
  editorToolbarMenuOpen: boolean
  focusAssistantPrompt: () => void
  focusEditor: () => void
  onAssistanceRangeSelect: (selection: EditorSelection) => void
  onEditorBeforeInput: (event: InputEvent) => void
  onEditorBlur: () => void
  onEditorFocus: () => void
  openEditorToolbarMenu: () => void
  patchChannel: PatchChannel
  setDocument: React.Dispatch<React.SetStateAction<SanityDocument>>
}

export const ScratchPadContext = React.createContext<ScratchPadContextValue | null>(null)

interface ScratchPadProviderProps {
  assistantPromptRef: React.MutableRefObject<HTMLTextAreaElement | null>
  children: React.ReactNode
  editorRef: React.RefObject<PortableTextEditor | null>
}

export function ScratchPadProvider(props: ScratchPadProviderProps) {
  const {children, editorRef, assistantPromptRef} = props
  const [editorFocused, setEditorFocused] = useState(false)
  const editor = editorRef.current

  const patchChannel = useMemo(() => createPatchChannel(), [])

  const [document, setDocument] = useState<SanityDocument>({
    _id: '123',
    _type: 'scratchPadDocument',
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: '123',
    portableText: [
      {
        _key: '123',
        _type: 'block',
        style: 'h1',
        markDefs: [],
        children: [
          {
            _key: 'abc',
            _type: 'span',
            text: 'My brainstorm',
            marks: [],
          },
        ],
      },
      {
        _key: '456',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _key: 'def',
            _type: 'span',
            text: 'Something something',
            marks: [],
          },
        ],
      },
    ],
  })

  // A content selection that the user has requested assistance with
  const [assistanceSelection, setAssistanceSelection] = useState<EditorSelection | null>(null)

  // A fragment (contents) of the assistanceSelection
  const [assistanceFragment, setAssistanceFragment] = useState<PortableTextBlock[] | undefined>()

  const [editorToolbarMenuOpen, setEditorToolbarMenuOpen] = useState<boolean>(false)

  const focusEditor = useCallback(() => {
    requestAnimationFrame(() => {
      if (editor) {
        PortableTextEditor.focus(editor)
      }
    })
  }, [editor])

  const focusAssistantPrompt = useCallback(() => {
    assistantPromptRef.current?.focus()
  }, [assistantPromptRef])

  const closeEditorToolbarMenu = useCallback(() => {
    requestAnimationFrame(() => setEditorToolbarMenuOpen(false))
  }, [])

  const onEditorFocus = useCallback((): void => {
    setEditorFocused(true)
  }, [])

  const onEditorBlur = useCallback((): void => {
    setEditorFocused(false)
  }, [])

  const openEditorToolbarMenu = useCallback(() => {
    requestAnimationFrame(() => setEditorToolbarMenuOpen(true))
  }, [])

  const onEditorBeforeInput = useCallback((event: InputEvent): void => {
    // eslint-disable-next-line no-console
    // console.log('On editor beforeInput')
  }, [])

  const onAssistanceRangeSelect = useCallback((selection: EditorSelection): void => {
    setAssistanceSelection(selection)
  }, [])

  useEffect(() => {
    if (assistanceSelection && editor) {
      setAssistanceFragment(PortableTextEditor.getFragment(editor))
    }
  }, [assistanceSelection, editor])

  const ctxValue = useMemo(
    () =>
      ({
        assistanceFragment,
        assistanceSelection,
        assistantPromptRef,
        closeEditorToolbarMenu,
        document,
        editorFocused,
        editorRef,
        editorToolbarMenuOpen,
        focusAssistantPrompt,
        focusEditor,
        onAssistanceRangeSelect,
        onEditorBeforeInput,
        onEditorBlur,
        onEditorFocus,
        openEditorToolbarMenu,
        patchChannel,
        setDocument,
      }) satisfies ScratchPadContextValue,
    [
      assistanceFragment,
      assistanceSelection,
      assistantPromptRef,
      closeEditorToolbarMenu,
      document,
      editorFocused,
      editorRef,
      editorToolbarMenuOpen,
      focusAssistantPrompt,
      focusEditor,
      onAssistanceRangeSelect,
      onEditorBeforeInput,
      onEditorBlur,
      onEditorFocus,
      openEditorToolbarMenu,
      patchChannel,
    ],
  )

  return <ScratchPadContext.Provider value={ctxValue}>{children}</ScratchPadContext.Provider>
}
