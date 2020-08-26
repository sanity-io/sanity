import {useState, useEffect} from 'react'
import client from 'part:@sanity/base/client'
import {observeForPreview} from 'part:@sanity/base/preview'

type PreviewSnapshot =
  | {
      title: string
    }
  | undefined

export function getRefValue(refId: string | undefined) {
  const [value, setValue] = useState(undefined)
  useEffect(() => {
    if (refId) {
      const subscription = client.observable.getDocument(refId).subscribe(document => {
        setValue(document)
      })
      return () => {
        subscription.unsubscribe()
      }
    }
    return () => {}
  }, [refId])
  return value
}

export function useRefPreview(value, schemaType): PreviewSnapshot {
  const [preview, setPreview] = useState(undefined)
  useEffect(() => {
    let subscription
    if (value && schemaType) {
      subscription = observeForPreview(value, schemaType).subscribe(result => {
        setPreview(result.snapshot)
      })
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [value])
  return preview
}
