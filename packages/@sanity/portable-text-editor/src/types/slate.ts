import {type PortableTextSpan, type PortableTextTextBlock} from '@sanity/types'
import {type BaseEditor, type Descendant} from 'slate'
import {type ReactEditor} from 'slate-react'

import {type PortableTextSlateEditor} from '..'

export interface VoidElement {
  _type: string
  _key: string
  children: Descendant[]
  __inline: boolean
  value: Record<string, unknown>
}

export interface SlateTextBlock extends Omit<PortableTextTextBlock, 'children'> {
  children: Descendant[]
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & PortableTextSlateEditor
    Element: SlateTextBlock | VoidElement
    Text: PortableTextSpan
  }
}
