import {type ReferenceSchemaType} from '@sanity/types'
import {Stack, Text} from '@sanity/ui'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {AlertStrip} from '../../components/AlertStrip'

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
          mode="ghost"
          onClick={handleRemoveStrengthenOnPublish}
          size="large"
          text={t('inputs.reference.incomplete-reference.strengthen-button-label')}
          tone="positive"
        />
      </Stack>
    </AlertStrip>
  )
}
