import React from 'react'

export function JSONPreviewDocumentView(props: any) {
  return <pre>{JSON.stringify(props.document, null, 2)}</pre>
}
