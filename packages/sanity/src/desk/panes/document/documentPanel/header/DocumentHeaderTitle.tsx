import React, {ReactElement} from 'react'
import {useDocumentTitle} from '../../useDocumentTitle'

export function DocumentHeaderTitle(): ReactElement {
  const {error, title} = useDocumentTitle()

  if (error) {
    return <>{error}</>
  }

  return <>{title || <span style={{color: 'var(--card-muted-fg-color)'}}>Untitled</span>}</>
}
