import React, {ComponentProps} from 'react'
import {Button} from '@sanity/ui'
import {useRouter} from '../legacyParts'

export function IntentButton(
  props: Omit<ComponentProps<typeof Button>, 'href'> & {
    intent: string
    params: Record<string, string>
  }
) {
  const router = useRouter()

  return <Button {...props} as="a" href={router.resolveIntentLink(props.intent, props.params)} />
}
