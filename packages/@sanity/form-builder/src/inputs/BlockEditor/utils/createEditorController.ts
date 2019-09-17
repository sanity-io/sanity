import {Editor as SlateEditor} from 'slate'
import {SlateValue, SlateChange} from '../typeDefs'

type Opts = {
  value?: SlateValue
  plugins?: any[]
  onChange?: (arg0: SlateChange) => void
}

export default function(opts: Opts) {
  return new SlateEditor(opts)
}
