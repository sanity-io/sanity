import {Card, PortalProvider, TextInput, usePortal} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {useMemo} from 'react'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {DefaultEditDialog} from '../DialogModal'

function ObjectEditDialog() {
  const portal = usePortal()
  const portalElements = useMemo(() => ({default: portal.element}), [portal.element])

  return (
    <PortalProvider __unstable_elements={portalElements} element={portal.element}>
      <Card padding={4} style={{minHeight: 420, maxWidth: 640}}>
        <DefaultEditDialog autoFocus={false} onClose={noop} title="Edit Image" width={1}>
          <VStack gap={4}>
            <VStack gap={2}>
              <Text size={1} weight="medium" as="div" trim={true}>
                Alternative text
              </Text>
              <TextInput defaultValue="A mountain lake at dawn" />
            </VStack>
            <VStack gap={2}>
              <Text size={1} weight="medium" as="div" trim={true}>
                Caption
              </Text>
              <TextInput defaultValue="" />
            </VStack>
          </VStack>
        </DefaultEditDialog>
      </Card>
    </PortalProvider>
  )
}

/**
 * Chromatic sentinel for the Portable Text object-edit dialog after the ui5
 * Box migration. The dialog is the full-width sibling of the popover already
 * covered by Editor Chrome: header title + close, PresenceOverlay margins,
 * and a scrolling body of fixture fields. Shared with Storybook via a thin
 * CSF wrapper.
 */
export function DialogModalStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ObjectEditDialog />
    </TestWrapper>
  )
}
