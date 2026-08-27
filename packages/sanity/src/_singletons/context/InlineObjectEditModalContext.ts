import {createContext} from 'sanity/_createContext'

export interface InlineObjectEditModalContextValue {
  active: boolean
  setActive: (active: boolean) => void
}

export const InlineObjectEditModalContext = createContext<InlineObjectEditModalContextValue | null>(
  'sanity/_singletons/context/inline-object-edit-modal',
  null,
)
