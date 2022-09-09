import {PortableTextEditor} from '../editor/PortableTextEditor'

export type createEditorOptions = {
  portableTextEditor: PortableTextEditor
}

export type HotkeyOptions = {
  marks?: Record<string, string>
  custom?: Record<string, (event: React.BaseSyntheticEvent, editor: PortableTextEditor) => void>
}
