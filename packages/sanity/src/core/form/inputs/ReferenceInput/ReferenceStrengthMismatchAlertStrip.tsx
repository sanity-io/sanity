import {Stack, Text} from '@sanity/ui'
import React from 'react'
import {Button} from '../../../../ui'
import {Translate, useTranslation} from '../../../i18n'
import {AlertStrip} from '../../components/AlertStrip'

/**
 * Alert strip that shows an explanation and action prompting the user to fix a mismatch in
 * reference strength, eg when the schema declares it should be weak, but the reference is actually
 * strong, or wise versa.
 *
 * @internal
 */
export function ReferenceStrengthMismatchAlertStrip({
  actualStrength,
  handleFixStrengthMismatch,
}: {
  actualStrength: 'weak' | 'strong'
  handleFixStrengthMismatch: () => void
}) {
  const shouldBe = actualStrength === 'weak' ? 'strong' : 'weak'
  const {t} = useTranslation()
  return (
    <AlertStrip
      padding={1}
      title={t('inputs.reference.strength-mismatch.title')}
      status="warning"
      data-testid="alert-reference-strength-mismatch"
    >
      <Stack space={3}>
        <Text as="p" muted size={1}>
          <Translate
            t={t}
            i18nKey={
              actualStrength === 'weak'
                ? 'inputs.reference.strength-mismatch.is-weak-description'
                : 'inputs.reference.strength-mismatch.is-strong-description'
            }
          />
        </Text>

        <Text as="p" muted size={1}>
          {t(
            shouldBe === 'weak'
              ? 'inputs.reference.strength-mismatch.is-strong-consquences'
              : 'inputs.reference.strength-mismatch.is-weak-consquences',
          )}
        </Text>
        <Button
          mode="ghost"
          onClick={handleFixStrengthMismatch}
          size="large"
          text={t(
            shouldBe === 'weak'
              ? 'inputs.reference.strength-mismatch.weaken-button-label'
              : 'inputs.reference.strength-mismatch.strengthen-button-label',
          )}
          tone="caution"
        />
      </Stack>
    </AlertStrip>
  )
}
