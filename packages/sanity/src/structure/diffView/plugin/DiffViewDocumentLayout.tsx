import {type ComponentType, type PropsWithChildren} from 'react'
import {type DocumentLayoutProps} from 'sanity'

import {DiffView} from '../components/DiffView'
import {useDiffViewState} from '../hooks/useDiffViewState'

export const DiffViewDocumentLayout: ComponentType<
  PropsWithChildren<Pick<DocumentLayoutProps, 'documentId' | 'documentType'>>
> = ({children, documentId}) => {
  const {state} = useDiffViewState()

  return (
    <>
      {children}
      {state === 'ready' && <DiffView documentId={documentId} />}
    </>
  )
}
