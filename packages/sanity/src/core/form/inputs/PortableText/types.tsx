import type {PortableTextBlock, Path} from '@sanity/types'

/**
 * @internal
 */
export type ObjectEditData = {
  editorPath: Path // The object representation in the editor (i.e. an text for an annotation)
  formBuilderPath: Path // The actual data storage path in the PT model (like .markDefs for annotations)
  kind: 'annotation' | 'blockObject' | 'inlineObject'
  editorHTMLElementRef?: React.MutableRefObject<HTMLElement | null> // Optional reference to editor HTML Element
}

/**
 * @beta
 */
export interface RenderBlockActionsProps {
  block: PortableTextBlock
  value: PortableTextBlock[] | undefined
  set: (block: PortableTextBlock) => void
  unset: () => void
  insert: (block: PortableTextBlock | PortableTextBlock[]) => void
}

/**
 * @beta
 */
export type RenderBlockActionsCallback = (props: RenderBlockActionsProps) => React.ReactNode
