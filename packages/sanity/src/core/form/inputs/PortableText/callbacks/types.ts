import {PortableTextBlock} from '@sanity/types'

export type UnsetCallback = () => void
export type SetCallback = (block: PortableTextBlock) => void
export type InsertCallback = (blocks: PortableTextBlock | PortableTextBlock[]) => void
