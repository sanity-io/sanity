import {Stack, Flex, Heading, Badge, Text} from '@sanity/ui'
import React from 'react'
import type {ChangelogItem as ChangeItem} from '../../../../module-status'
import {ChangelogItem} from './ChangelogItem'

interface ChangelogListProps {
  changeItems: ChangeItem[]
  isLatest: boolean
  version: string
}

export function ChangelogList(props: ChangelogListProps) {
  const {changeItems, isLatest, version} = props

  const features = changeItems.filter((c) => c.changeType === 'feature')
  const bugfixes = changeItems.filter((c) => c.changeType === 'bugfix')
  const bugFixesDescription = bugfixes.map(({description}) => description).flat()

  return (
    <Stack space={4}>
      <Flex align="center" gap={2}>
        <Heading size={1}>v{version}</Heading>

        {isLatest && <Badge tone="positive">Latest</Badge>}
      </Flex>

      <Stack space={3}>
        {features?.map((change) => (
          <ChangelogItem
            key={change.title}
            changeType={change.changeType}
            description={change?.description}
            title={change.title}
          />
        ))}

        {bugFixesDescription.length > 0 && (
          <ChangelogItem changeType="bugfix" description={bugFixesDescription} />
        )}
      </Stack>

      <Flex justify="flex-end">
        <Text size={1}>
          <a
            href="https://github.com/sanity-io/sanity/releases"
            rel="noreferrer noopener"
            target="_blank"
          >
            See full changelog on GitHub
          </a>
        </Text>
      </Flex>
    </Stack>
  )
}
