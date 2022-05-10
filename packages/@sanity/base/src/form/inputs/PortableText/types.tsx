import type {PortableTextBlock} from '@sanity/portable-text-editor'
import type {Path} from '@sanity/types'

/**
 * @alpha
 */
export type ObjectEditData = {
  editorPath: Path // The object representation in the editor (i.e. an text for an annotation)
  formBuilderPath: Path // The actual data storage path in the PT model (like .markDefs for annotations)
  kind: 'annotation' | 'blockObject' | 'inlineObject'
  editorHTMLElementRef?: React.MutableRefObject<HTMLElement | null> // Optional reference to editor HTML Element
}

/**
 * @alpha
 */
export interface RenderBlockActionsProps {
  block: PortableTextBlock
  value: PortableTextBlock[] | undefined
  set: (block: PortableTextBlock) => void
  unset: () => void
  insert: (block: PortableTextBlock | PortableTextBlock[]) => void
}

/**
 * @alpha
 */
export type RenderBlockActionsCallback = (props: RenderBlockActionsProps) => React.ReactNode
