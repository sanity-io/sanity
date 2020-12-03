import {Button} from '@sanity/ui'
import {useRouter} from 'part:@sanity/base/router'
import React from 'react'

export function IntentButton(props) {
  const router = useRouter()

  return <Button {...props} as="a" href={router.resolveIntentLink(props.intent, props.params)} />
}
