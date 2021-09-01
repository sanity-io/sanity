import {EditorSelection, PortableTextBlock} from '../../src'

export default {}

type Value = PortableTextBlock[] | undefined

type Editor = {
  getValue: () => Promise<Value>
  getSelection: () => Promise<EditorSelection | null>
  insertText: (text: string) => Promise<void>
  insertNewLine: () => Promise<void>
  pressKey: (keyName: string, times?: number) => Promise<void>
}
declare global {
  function setDocumentValue(value: Value): void
  function getEditors(): Promise<Editor[]>
}
