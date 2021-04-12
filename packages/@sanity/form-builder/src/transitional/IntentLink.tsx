import React, {ComponentProps, useCallback} from 'react'
import {useRouter} from '../legacyParts'

export function IntentLink(
  props: Omit<ComponentProps<'a'>, 'href'> & {intent: string; params: Record<string, string>}
) {
  const router = useRouter()

  const handleClick = useCallback(
    (event) => {
      event.preventDefault()
      router.navigateIntent(props.intent, props.params)
    },
    [props.intent, props.params, router]
  )

  return (
    <a
      {...props}
      href={router.resolveIntentLink(props.intent, props.params)}
      onClick={handleClick}
    />
  )
}
