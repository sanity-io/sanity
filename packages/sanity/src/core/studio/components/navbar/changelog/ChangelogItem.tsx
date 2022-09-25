import {Card, Stack, Label, Heading} from '@sanity/ui'
import React from 'react'
import type {ChangelogItem as ChangeItem} from './module-status'
import {PortableTextContent} from './portableTextContent'

const LABELS: Record<'bugfix' | 'feature', string> = {
  bugfix: 'Bugfixes',
  feature: 'Feature',
}

export function ChangelogItem(props: ChangeItem) {
  const {changeType, description, title} = props
  const label = LABELS[changeType]

  return (
    <Card padding={4} shadow={1} radius={2}>
      <Stack space={title ? 4 : 3}>
        {label && <Label size={1}>{label}</Label>}

        <Stack space={3}>
          {title && <Heading size={1}>{title}</Heading>}

          {description && <PortableTextContent value={description} />}
        </Stack>
      </Stack>
    </Card>
  )
}
