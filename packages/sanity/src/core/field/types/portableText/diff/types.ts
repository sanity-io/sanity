import {PortableTextTextBlock} from '@sanity/types'
import {ObjectDiff} from '../../../types'

export type PortableTextDiff = ObjectDiff & {
  displayValue: PortableTextTextBlock
  origin: ObjectDiff
}

export type MarkSymbolMap = Record<string, string[]>

export type InlineSymbolMap = Record<string, string>
