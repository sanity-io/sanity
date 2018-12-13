// @flow

import {Editor as SlateEditor} from 'slate'
import type {SlateValue, SlateChange} from '../typeDefs'

type Opts = {
  value: SlateValue,
  plugins?: any[],
  onChange?: SlateChange => void
}

export default function(opts: Opts) {
  return new SlateEditor(opts)
}
