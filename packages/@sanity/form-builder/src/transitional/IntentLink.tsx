import React, {ComponentProps} from 'react'
import {useRouter} from '../legacyParts'

export function IntentLink(
  props: Omit<ComponentProps<'a'>, 'href'> & {intent: string; params: Record<string, string>}
) {
  const router = useRouter()

  return <a {...props} href={router.resolveIntentLink(props.intent, props.params)} />
}
