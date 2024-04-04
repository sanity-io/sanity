import {type Path} from '@sanity/types'

/**
 * A generic marker for attaching metadata to specific nodes of the Portable Text input.
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 * @param type - a type name for this marker
 * @param data - some data connected to this marker
 * @param path - the path to the Portable Text content connected to this marker
 */
export interface PortableTextMarker {
  type: string
  data?: unknown
  path: Path
}
