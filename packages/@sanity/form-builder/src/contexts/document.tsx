import {SanityDocument} from '@sanity/types'
import hocify from 'hocify'
import React, {ConsumerProps, createContext, ReactNode, useContext} from 'react'

const Context = createContext<SanityDocument | null>(null)

export function DocumentProvider(props: {document: SanityDocument; children?: ReactNode}) {
  return <Context.Provider value={props.document}>{props.children}</Context.Provider>
}

export function useDocument() {
  const doc = useContext(Context)
  if (doc === null) {
    throw new Error(`useDocument() must be used within a DocumentProvider`)
  }
  return doc
}

export const withDocument = hocify(() => ({document: useDocument()}))

export function WithDocument(props: ConsumerProps<SanityDocument>) {
  return (
    <Context.Consumer>
      {(value) => {
        if (value === null) {
          throw new Error('WithDocument must be used within a DocumentProvider')
        }
        return props.children(value)
      }}
    </Context.Consumer>
  )
}
