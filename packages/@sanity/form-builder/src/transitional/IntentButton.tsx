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

  const href = props.disabled ? undefined : router.resolveIntentLink(props.intent, props.params)
  return <Button {...props} as="a" href={href} />
}
