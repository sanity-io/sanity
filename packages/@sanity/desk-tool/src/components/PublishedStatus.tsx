import {PublishIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import React from 'react'

export const PublishedStatus = () => (
  <Text size={1} as="span" muted title="Document is published">
    <PublishIcon aria-label="Document is published" />
  </Text>
)
