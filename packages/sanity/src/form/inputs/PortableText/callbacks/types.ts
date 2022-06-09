import {PortableTextBlock} from '@sanity/portable-text-editor'

export type UnsetCallback = () => void
export type SetCallback = (block: PortableTextBlock) => void
export type InsertCallback = (blocks: PortableTextBlock | PortableTextBlock[]) => void
