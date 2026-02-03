import {type ObjectDiff} from '../../../types'
import {type PortableTextTextBlock} from '@sanity/types'

export type PortableTextDiff = ObjectDiff & {
  displayValue: PortableTextTextBlock
  origin: ObjectDiff
}

export type MarkSymbolMap = Record<string, string[]>

export type InlineSymbolMap = Record<string, string>
