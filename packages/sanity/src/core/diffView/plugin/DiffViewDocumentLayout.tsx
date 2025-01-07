import {type ComponentType} from 'react'

import {type DocumentLayoutProps} from '../../config'
import {DiffView} from '../components/DiffView'
import {useDiffViewState} from '../hooks/useDiffViewState'

export const DiffViewDocumentLayout: ComponentType<DocumentLayoutProps> = (props) => {
  const {state} = useDiffViewState()

  return (
    <>
      {props.renderDefault(props)}
      {state === 'ready' && <DiffView documentId={props.documentId} />}
    </>
  )
}
