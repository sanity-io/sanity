import {Card, Flex} from '@sanity/ui'
import {useState} from 'react'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {Button} from '../../button/Button'
import {ConfirmPopover, type ConfirmPopoverProps} from '../ConfirmPopover'

const SCHEMA_TYPES: [] = []

function ConfirmPopoverExample(props: {
  buttonText: string
  buttonTone: 'critical' | 'caution'
  message: string
  tone: ConfirmPopoverProps['tone']
}) {
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)

  return (
    <Card padding={5} style={{minHeight: 240, minWidth: 380}}>
      <Button ref={setReferenceElement} text={props.buttonText} tone={props.buttonTone} />
      <ConfirmPopover
        message={props.message}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        open
        placement="bottom"
        referenceElement={referenceElement}
        tone={props.tone}
      />
    </Card>
  )
}

/**
 * Open confirm popovers in critical and caution tones. Footer buttons inherit
 * card/button tones, so a ui5 migration can change both layout (portal
 * placement, min width) and the confirm treatment without a type error.
 * `TestWrapper` supplies studio i18n for the cancel/confirm labels.
 */
export function ConfirmPopoverStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Flex gap={6} padding={4} wrap="wrap">
        <ConfirmPopoverExample
          buttonText="Delete"
          buttonTone="critical"
          message="Are you sure you want to delete this document?"
          tone="critical"
        />
        <ConfirmPopoverExample
          buttonText="Unpublish"
          buttonTone="caution"
          message="Unpublish this document? It will no longer be available to the public."
          tone="caution"
        />
      </Flex>
    </TestWrapper>
  )
}
