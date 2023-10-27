import {PortableTextBlock} from '@sanity/types'
import {EditorSelection} from '../../src'

export {}

type Value = PortableTextBlock[] | undefined

type Editor = {
  editorId: string
  focus: () => Promise<void>
  getSelection: () => Promise<EditorSelection | null>
  getValue: () => Promise<Value>
  insertText: (text: string) => Promise<void>
  paste: (text: string, type?: string) => Promise<void>
  pressKey: (keyName: string, times?: number) => Promise<void>
  redo: () => Promise<void>
  setSelection: (selection: EditorSelection | null) => Promise<void>
  testId: string
  toggleMark: (hotkey: string) => Promise<void>
  undo: () => Promise<void>
}

declare global {
  function getEditors(): Promise<Editor[]>
  function setDocumentValue(value: Value): Promise<void>
}
