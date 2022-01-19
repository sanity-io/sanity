import {BaseEditor, Descendant} from 'slate'
import {ReactEditor} from '@sanity/slate-react'
import {PortableTextSlateEditor, TextBlock, TextSpan} from '..'

interface VoidElement {
  _type: string
  _key: string
  children: Descendant[]
  __inline: boolean
  value: {
    [other: string]: any
  }
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & PortableTextSlateEditor
    Element: TextBlock | VoidElement
    Text: TextSpan
  }
}
