import {useState, useEffect} from 'react'
import client from 'part:@sanity/base/client'

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
