import {PortableTextEditor} from '../editor/PortableTextEditor'
import {PatchObservable} from './editor'

export type createEditorOptions = {
  isPending: React.MutableRefObject<boolean | null>
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
