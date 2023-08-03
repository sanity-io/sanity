import React, {ReactElement} from 'react'
import {useDocumentTitle} from '../../useDocumentTitle'
import {useDocumentPane} from '../../useDocumentPane'

export function DocumentHeaderTitle(): ReactElement {
  const {connectionState} = useDocumentPane()
  const {error, title} = useDocumentTitle()

  if (connectionState !== 'connected') {
    return <></>
  }

  if (error) {
    return <>{error}</>
  }

  return <>{title || <span style={{color: 'var(--card-muted-fg-color)'}}>Untitled</span>}</>
}
