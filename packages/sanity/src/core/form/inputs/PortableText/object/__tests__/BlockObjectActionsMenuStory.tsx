import {type PortableTextBlock} from '@sanity/types'
import {Card, PortalProvider, usePortal} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useMemo} from 'react'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {BlockObjectActionsMenu} from '../BlockObjectActionsMenu'

const IMAGE_BLOCK: PortableTextBlock = {_type: 'image', _key: 'img1'}
const REFERENCE_BLOCK: PortableTextBlock = {
  _type: 'reference',
  _key: 'ref1',
  _ref: 'article-1',
}

function Preview({label}: {label: string}) {
  return (
    <Card border padding={3} radius={2}>
      <Text size={1} as="div" trim={true}>
        {label}
      </Text>
    </Card>
  )
}

function DefaultPortal({children}: {children: ReactNode}) {
  const portal = usePortal()
  const portalElements = useMemo(() => ({default: portal.element}), [portal.element])

  return (
    <PortalProvider __unstable_elements={portalElements} element={portal.element}>
      {children}
    </PortalProvider>
  )
}

/**
 * Chromatic sentinel for the Portable Text object-block action row after the
 * ui5 Flex / Box migration: a bleed ellipsis next to the block preview,
 * with Edit / Remove, read-only View, and the extra Open reference item.
 * The open menu is a sibling story. Shared with Storybook via a thin CSF
 * wrapper.
 */
export function BlockObjectActionsMenuStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <DefaultPortal>
        <Card padding={4} style={{maxWidth: 360}}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                default
              </Text>
              <BlockObjectActionsMenu
                focused={false}
                onOpen={noop}
                onRemove={noop}
                value={IMAGE_BLOCK}
              >
                <Preview label="Image" />
              </BlockObjectActionsMenu>
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                read only
              </Text>
              <BlockObjectActionsMenu
                focused={false}
                onOpen={noop}
                onRemove={noop}
                readOnly
                value={IMAGE_BLOCK}
              >
                <Preview label="Image" />
              </BlockObjectActionsMenu>
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                reference
              </Text>
              <BlockObjectActionsMenu
                focused={false}
                onOpen={noop}
                onRemove={noop}
                value={REFERENCE_BLOCK}
              >
                <Preview label="Author" />
              </BlockObjectActionsMenu>
            </VStack>
          </VStack>
        </Card>
      </DefaultPortal>
    </TestWrapper>
  )
}

/**
 * Single trigger so the Open story snapshot is the portaled Edit / Remove
 * menu, not a grid of closed ellipsis buttons.
 */
export function BlockObjectActionsMenuOpenStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <DefaultPortal>
        <Card padding={4} style={{minHeight: 240, maxWidth: 360}}>
          <BlockObjectActionsMenu focused onOpen={noop} onRemove={noop} value={IMAGE_BLOCK}>
            <Preview label="Image" />
          </BlockObjectActionsMenu>
        </Card>
      </DefaultPortal>
    </TestWrapper>
  )
}
