import {type MutableRefObject, type ReactNode} from 'react'

import {type ArrayOfObjectsItemMember} from '../../store/types/members'
import {type ObjectFormNode} from '../../store/types/nodes'

/** @internal */
export type PortableTextEditorElement = HTMLDivElement | HTMLSpanElement

/** @internal */
export interface PortableTextMemberItem {
  kind: 'annotation' | 'textBlock' | 'objectBlock' | 'inlineObject'
  key: string
  member: ArrayOfObjectsItemMember
  node: ObjectFormNode
  elementRef?: MutableRefObject<PortableTextEditorElement | null>
  input?: ReactNode
}
