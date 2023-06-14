import {PortableTextEditor} from '../editor/PortableTextEditor'
import {PatchObservable} from './editor'

export type createEditorOptions = {
  keyGenerator: () => string
  patches$?: PatchObservable
  portableTextEditor: PortableTextEditor
  readOnly: boolean
  maxBlocks?: number
}

export type HotkeyOptions = {
  marks?: Record<string, string>
  custom?: Record<string, (event: React.BaseSyntheticEvent, editor: PortableTextEditor) => void>
}
