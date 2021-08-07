// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import {IntentLink} from 'part:@sanity/base/router'
import createButtonLike from './createButtonLike'

const AsLink = createButtonLike(IntentLink as any, {displayName: 'LinkButton'})
const AsButton = createButtonLike('button', {displayName: 'LinkButton'})

export default function IntentButton(props: any) {
  const {disabled, intent, params, ...rest} = props
  return disabled ? (
    <AsButton disabled {...rest} />
  ) : (
    <AsLink intent={intent} params={params} {...rest} />
  )
}
