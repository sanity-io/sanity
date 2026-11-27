import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {useState} from 'react'
import {Flex} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {ActionStateDialog} from '../ActionStateDialog'

function ConfirmExample(props: {
  buttonText: string
  buttonTone?: 'critical'
  confirmButtonText?: string
  message: string
  tone?: 'critical'
}) {
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)

  return (
    <Card padding={5} style={{minHeight: 240, minWidth: 380}}>
      <Button ref={setReferenceElement} text={props.buttonText} tone={props.buttonTone} />
      <ActionStateDialog
        dialog={{
          type: 'confirm',
          message: props.message,
          onCancel: noop,
          onConfirm: noop,
          confirmButtonText: props.confirmButtonText,
          tone: props.tone,
        }}
        referenceElement={referenceElement}
      />
    </Card>
  )
}

/**
 * Chromatic sentinel for document-action confirm popovers after the ui5
 * ConfirmPopover migration. Fallback Cancel/OK labels come from the
 * structure locale bundle; the critical row supplies custom button copy.
 * Fixture messages only — no live document action.
 */
export function ActionStateDialogStory() {
  return (
    <TestWrapper i18nBundles={[structureUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Flex gap={6} padding={4} flexWrap="wrap">
        <ConfirmExample buttonText="Publish" message="Publish this document?" />
        <ConfirmExample
          buttonText="Delete"
          buttonTone="critical"
          confirmButtonText="Delete now"
          message="Delete this document? This cannot be undone."
          tone="critical"
        />
      </Flex>
    </TestWrapper>
  )
}
