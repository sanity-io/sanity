import {KeyInput} from 'puppeteer'
import {EditorSelection, PortableTextBlock} from '../../src'

export default {}

type Value = PortableTextBlock[] | undefined

type Editor = {
  editorId: string
  focus: () => Promise<void>
  getSelection: () => Promise<EditorSelection | null>
  getValue: () => Promise<Value>
  insertText: (text: string) => Promise<void>
  pressKey: (keyName: KeyInput, times?: number) => Promise<void>
  setSelection: (selection: EditorSelection | null) => Promise<void>
  testId: string
}
declare global {
  function getEditors(): Promise<Editor[]>
  function setDocumentValue(value: Value): void
}
