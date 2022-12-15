import i18n from 'i18next'
import k from './../../../../../i18n/keys'
import React from 'react'
import {Text} from '@sanity/ui'

// This is the fallback marker renderer if the block editor didn't get the 'renderCustomMarkers' prop
// You will probably only see this when you first start to play with custom markers as a developer
export function DefaultCustomMarkers() {
  return (
    <Text size={1}>
      {i18n.t(k.THIS_IS_A_EXAMPLE_CUSTOM_MARKE)} <code>{i18n.t(k.RENDERCUSTOMMARKERS)}</code>{' '}
      {i18n.t(k.FUNCTION)}
    </Text>
  )
}
