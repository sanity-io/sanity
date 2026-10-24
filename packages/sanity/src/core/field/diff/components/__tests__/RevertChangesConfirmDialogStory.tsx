import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {useState} from 'react'
import {Flex} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {RevertChangesConfirmDialog} from '../RevertChangesConfirmDialog'

function RevertExample(props: {buttonText: string; changeCount: number}) {
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)

  return (
    <Card padding={5} style={{minHeight: 240, minWidth: 380}}>
      <Button ref={setReferenceElement} text={props.buttonText} tone="critical" />
      <RevertChangesConfirmDialog
        changeCount={props.changeCount}
        onCancel={noop}
        onConfirm={noop}
        open
        referenceElement={referenceElement}
      />
    </Card>
  )
}

/**
 * Chromatic sentinel for the review-changes revert confirmation after the
 * ui5 ConfirmPopover migration. One-change versus many-change copy both
 * sit on a critical confirm row — a mix TypeScript will not catch.
 * Studio locale only; no live change list.
 */
export function RevertChangesConfirmDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Flex gap={6} padding={4} flexWrap="wrap">
        <RevertExample buttonText="Revert change" changeCount={1} />
        <RevertExample buttonText="Revert all" changeCount={4} />
      </Flex>
    </TestWrapper>
  )
}
