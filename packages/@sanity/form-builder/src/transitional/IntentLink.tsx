import {useRouter} from 'part:@sanity/base/router'
import React from 'react'

export function IntentLink(props) {
  const router = useRouter()

  return <a {...props} href={router.resolveIntentLink(props.intent, props.params)} />
}
