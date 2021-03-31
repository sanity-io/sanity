import React from 'react'
import {useRouter} from '../legacyParts'

export function IntentLink(props) {
  const router = useRouter()

  return <a {...props} href={router.resolveIntentLink(props.intent, props.params)} />
}
