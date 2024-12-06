import {BehaviorSubject} from 'rxjs'
import {createContext} from 'sanity/_createContext'

/** @internal */
export type PortableTextEditorElement = HTMLDivElement | HTMLSpanElement

/**
 * @internal
 */
export const PortableTextMemberItemElementRefsContext = createContext<
  BehaviorSubject<Record<string, PortableTextEditorElement | null | undefined>>
>('sanity/_singletons/context/portable-text-member-item-element-refs', new BehaviorSubject({}))
