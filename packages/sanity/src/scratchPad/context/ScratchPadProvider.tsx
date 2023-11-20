import {EditorSelection, PortableTextEditor, RangeDecoration} from '@sanity/portable-text-editor'
import React, {PropsWithChildren, useCallback, useEffect, useMemo, useState} from 'react'
import {PortableTextBlock, SanityDocument} from '@sanity/types'
import {PatchChannel, createPatchChannel} from '../../core'
import {AssistanceRange} from '../components/editor/AssistanceRange'

export interface ScratchPadContextValue {
  assistanceFragment: PortableTextBlock[] | undefined
  assistanceSelection: EditorSelection
  assistantPromptRef: React.MutableRefObject<HTMLTextAreaElement | null>
  closeEditorToolbarMenu: () => void
  document: SanityDocument
  editorFocused: boolean
  editorRef: React.MutableRefObject<PortableTextEditor | null>
  editorToolbarMenuOpen: boolean
  focusEditor: () => void
  onAssistanceRangeSelect: (selection: EditorSelection) => void
  onEditorKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onEditorBlur: () => void
  onEditorFocus: () => void
  openEditorToolbarMenu: () => void
  patchChannel: PatchChannel
  rangeDecorations: RangeDecoration[]
  setDocument: React.Dispatch<React.SetStateAction<SanityDocument>>
}

export const ScratchPadContext = React.createContext<ScratchPadContextValue | null>(null)

interface ScratchPadProviderProps {
  assistantPromptRef: React.MutableRefObject<HTMLTextAreaElement | null>
  children: React.ReactNode
  editorRef: React.RefObject<PortableTextEditor | null>
}

/**
 * @internal
 */
export function ScratchPadProvider(props: ScratchPadProviderProps) {
  const {children, editorRef, assistantPromptRef} = props
  const [editorFocused, setEditorFocused] = useState(false)
  const editor = editorRef.current
  // A content selection that the user has requested assistance with
  const [assistanceSelection, setAssistanceSelection] = useState<EditorSelection | null>(null)

  // A fragment (contents) of the assistanceSelection
  const [assistanceFragment, setAssistanceFragment] = useState<PortableTextBlock[] | undefined>()

  const [editorToolbarMenuOpen, setEditorToolbarMenuOpen] = useState<boolean>(false)

  const rangeDecorations: RangeDecoration[] = useMemo(
    () => [
      {
        isRangeInvalid: () => false,
        component: (componentProps: PropsWithChildren) => (
          <AssistanceRange>{componentProps.children}</AssistanceRange>
        ),
        selection: assistanceSelection,
      },
    ],
    [assistanceSelection],
  )

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

  const focusEditor = useCallback(() => {
    requestAnimationFrame(() => {
      if (editor) {
        PortableTextEditor.focus(editor)
      }
    })
  }, [editor])

  const closeEditorToolbarMenu = useCallback(() => {
    requestAnimationFrame(() => setEditorToolbarMenuOpen(false))
  }, [])

  const onAssistanceRangeSelect = useCallback((selection: EditorSelection): void => {
    setAssistanceSelection(selection)
  }, [])

  const onEditorFocus = useCallback((): void => {
    setEditorFocused(true)
  }, [])

  const onEditorBlur = useCallback((): void => {
    setEditorFocused(false)
  }, [])

  const onEditorKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>): void => {
    // eslint-disable-next-line no-console
    console.log('On editor keyDown')
  }, [])

  const openEditorToolbarMenu = useCallback(() => {
    requestAnimationFrame(() => setEditorToolbarMenuOpen(true))
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
        focusEditor,
        onAssistanceRangeSelect,
        onEditorBlur,
        onEditorFocus,
        onEditorKeyDown,
        openEditorToolbarMenu,
        patchChannel,
        rangeDecorations,
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
      focusEditor,
      onAssistanceRangeSelect,
      onEditorBlur,
      onEditorFocus,
      onEditorKeyDown,
      openEditorToolbarMenu,
      patchChannel,
      rangeDecorations,
    ],
  )

  return <ScratchPadContext.Provider value={ctxValue}>{children}</ScratchPadContext.Provider>
}
