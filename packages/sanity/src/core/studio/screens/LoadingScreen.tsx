import i18n from 'i18next'
import k from './../../../i18n/keys'
import React from 'react'
import {Flex, Spinner, Card, Text} from '@sanity/ui'

export function LoadingScreen() {
  return (
    // TODO: improve the design of this
    // think about having it load in the `_document` too
    <Flex
      // TODO: currently this card is here to accommodate dark mode vs light
      // mode backgrounds, however that logic should probably exist globally
      as={Card}
      justify="center"
      align="center"
      height="fill"
      direction="column"
      gap={4}
    >
      <Text muted>{i18n.t(k.LOADING)}</Text>
      <Spinner muted />
    </Flex>
  )
}
