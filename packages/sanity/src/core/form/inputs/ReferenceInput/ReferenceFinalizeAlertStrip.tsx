import type {ReferenceSchemaType} from '@sanity/types'
import {Button, Stack, Text} from '@sanity/ui'
import {AlertStrip} from '../../components/AlertStrip'
import {Translate, useTranslation} from '../../../i18n'
import React from 'react'

/**
 * Alert strip that shows an explanation and action prompting the user to finalize a reference,
 * in the case where a `strengthen on publish` flag is set and the remote document exists.
 *
 * @internal
 */
export function ReferenceFinalizeAlertStrip({
  schemaType,
  handleRemoveStrengthenOnPublish,
}: {
  schemaType: ReferenceSchemaType
  handleRemoveStrengthenOnPublish: () => void
}) {
  const {t} = useTranslation()
  return (
    <AlertStrip
      padding={1}
      title={t(
        schemaType.weak
          ? 'inputs.reference.incomplete-reference.finalize-action-title'
          : 'inputs.reference.incomplete-reference.strengthen-action-title',
      )}
      status="info"
      data-testid="alert-reference-published"
    >
      <Stack space={3}>
        <Text as="p" muted size={1}>
          <Translate
            t={t}
            i18nKey={
              schemaType.weak
                ? 'inputs.reference.incomplete-reference.finalize-action-description'
                : 'inputs.reference.incomplete-reference.strengthen-action-description'
            }
          />
        </Text>
        <Button
          onClick={handleRemoveStrengthenOnPublish}
          text={t('inputs.reference.incomplete-reference.strengthen-button-label')}
          tone="positive"
        />
      </Stack>
    </AlertStrip>
  )
}
