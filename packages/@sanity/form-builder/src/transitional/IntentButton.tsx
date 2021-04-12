import React, {ComponentProps, useCallback} from 'react'
import {Button} from '@sanity/ui'
import {useRouter} from '../legacyParts'

export function IntentButton(
  props: Omit<ComponentProps<typeof Button>, 'as' | 'href'> & {
    intent: string
    params: Record<string, string>
  }
) {
  const router = useRouter()

  const handleClick = useCallback(
    (event) => {
      event.preventDefault()
      router.navigateIntent(props.intent, props.params)
    },
    [props.intent, props.params, router]
  )

  const href = props.disabled ? undefined : router.resolveIntentLink(props.intent, props.params)

  return <Button onClick={href ? handleClick : undefined} {...props} as="a" href={href} />
}
