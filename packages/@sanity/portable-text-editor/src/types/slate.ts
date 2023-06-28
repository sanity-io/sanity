import {BaseEditor, Descendant} from 'slate'
import {ReactEditor} from 'slate-react'
import {PortableTextSpan, PortableTextTextBlock} from '@sanity/types'
import {PortableTextSlateEditor} from '..'

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
