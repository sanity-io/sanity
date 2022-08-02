import {Subject} from 'rxjs'
import {PortableTextFeatures} from '../types/portableText'
import {EditorChange, PatchObservable} from '../types/editor'
import {PortableTextEditor} from '../editor/PortableTextEditor'

export type createEditorOptions = {
  portableTextFeatures: PortableTextFeatures
  keyGenerator: () => string
  change$: Subject<EditorChange>
  maxBlocks?: number
  hotkeys?: HotkeyOptions
  incomingPatches$?: PatchObservable
  readOnly: boolean
  syncValue: () => void
}

export type HotkeyOptions = {
  marks?: Record<string, string>
  custom?: Record<string, (event: React.BaseSyntheticEvent, editor: PortableTextEditor) => void>
}
