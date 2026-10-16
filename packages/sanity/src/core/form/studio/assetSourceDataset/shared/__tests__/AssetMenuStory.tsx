import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {AssetMenu} from '../AssetMenu'

function Labelled({label, children}: {label: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium">
        {label}
      </Text>
      {children}
    </VStack>
  )
}

/**
 * Chromatic sentinel for the dataset asset-source row menu after the ui5
 * Button/Menu migration: ghost-bordered default, selected (primary default
 * mode, no border), and unselected bleed. Open is a separate story so the
 * portaled Show usage / critical Delete items are snapshotted.
 */
export function AssetMenuStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <Flex gap={5}>
          <Labelled label="bordered (default row)">
            <AssetMenu border isSelected={false} onAction={noop} />
          </Labelled>
          <Labelled label="selected, no border">
            <AssetMenu border={false} isSelected onAction={noop} />
          </Labelled>
          <Labelled label="unselected, no border">
            <AssetMenu border={false} isSelected={false} onAction={noop} />
          </Labelled>
        </Flex>
      </Card>
    </TestWrapper>
  )
}

/**
 * Single trigger so play can open the portaled menu without colliding ids.
 */
export function AssetMenuOpenStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Flex justifyContent="center" padding={4} style={{minHeight: 240}}>
        <AssetMenu border isSelected={false} onAction={noop} />
      </Flex>
    </TestWrapper>
  )
}
