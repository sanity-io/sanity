import {type BaseSyntheticEvent} from 'react'

import {type PortableTextEditor} from '../editor/PortableTextEditor'
import {type PatchObservable} from './editor'

export type createEditorOptions = {
  keyGenerator: () => string
  patches$?: PatchObservable
  portableTextEditor: PortableTextEditor
  readOnly: boolean
  maxBlocks?: number
}

export type HotkeyOptions = {
  marks?: Record<string, string>
  custom?: Record<string, (event: BaseSyntheticEvent, editor: PortableTextEditor) => void>
}
