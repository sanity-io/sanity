import type {Subject} from 'rxjs'
import type {PortableTextFeatures} from '../types/portableText'
import type {EditorChange, PatchObservable} from '../types/editor'
import type {PortableTextEditor} from '../editor/PortableTextEditor'

export type createEditorOptions = {
  portableTextFeatures: PortableTextFeatures
  keyGenerator: () => string
  change$: Subject<EditorChange>
  maxBlocks?: number
  hotkeys?: HotkeyOptions
  incomingPatches$?: PatchObservable
  readOnly: boolean
}

export type HotkeyOptions = {
  marks?: Record<string, string>
  custom?: Record<string, (event: React.BaseSyntheticEvent, editor: PortableTextEditor) => void>
}
