import {Box, Card, Flex, Text} from '@sanity/ui'
import {type FormEvent, useCallback, useMemo, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {
  countVariantSetPermutations,
  type VariantSetDimension,
} from '../../util/variantSetPermutations'
import {VariantSetForm} from './VariantSetForm'

export interface VariantSetInput {
  name: string
  dimensions: VariantSetDimension[]
}

interface CreateVariantSetDialogProps {
  onCancel: () => void
  onSubmit: (input: VariantSetInput) => void
}

export function CreateVariantSetDialog(props: CreateVariantSetDialogProps): React.JSX.Element {
  const {onCancel, onSubmit} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const [name, setName] = useState('')
  const [dimensions, setDimensions] = useState<VariantSetDimension[]>([])
  const [dimensionsInvalid, setDimensionsInvalid] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  const permutationCount = useMemo(() => countVariantSetPermutations(dimensions), [dimensions])
  const canGenerate = Boolean(name.trim()) && permutationCount > 0 && !dimensionsInvalid

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!canGenerate) {
        setShowValidation(true)
        return
      }

      // TODO(variant-sets step 3): generate one variant definition per permutation and persist
      // them, each tagged with a back-reference to this set. Step 2 delivers the key/value input
      // and the live permutation preview only — generation is intentionally not wired yet.
      onSubmit({name: name.trim(), dimensions})
    },
    [canGenerate, dimensions, name, onSubmit],
  )

  return (
    <Dialog
      __unstable_autoFocus={false}
      header={t('dialog.create-set.title')}
      id="create-variant-set-dialog"
      onClickOutside={onCancel}
      onClose={onCancel}
      padding={false}
      width={1}
    >
      <Card borderTop padding={4}>
        <form onSubmit={handleSubmit}>
          <Box paddingBottom={4}>
            <VariantSetForm
              name={name}
              onDimensionsChange={setDimensions}
              onDimensionsValidityChange={setDimensionsInvalid}
              onNameChange={setName}
              showValidation={showValidation}
            />
          </Box>

          <Card
            border
            padding={3}
            radius={2}
            tone={permutationCount > 0 ? 'primary' : 'transparent'}
          >
            <Text data-testid="variant-set-preview" muted={permutationCount === 0} size={1}>
              {permutationCount > 0
                ? t(
                    permutationCount === 1
                      ? 'dialog.create-set.preview.count_one'
                      : 'dialog.create-set.preview.count_other',
                    {count: permutationCount},
                  )
                : t('dialog.create-set.preview.empty')}
            </Text>
          </Card>

          <Flex gap={2} justify="flex-end" paddingTop={5}>
            <Button
              mode="ghost"
              onClick={onCancel}
              text={t('dialog.create-set.action.cancel')}
              type="button"
            />
            <Button
              data-testid="generate-variant-set-button"
              disabled={!canGenerate}
              size="large"
              text={t(
                permutationCount === 1
                  ? 'dialog.create-set.action.generate_one'
                  : 'dialog.create-set.action.generate_other',
                {count: permutationCount},
              )}
              type="submit"
            />
          </Flex>
        </form>
      </Card>
    </Dialog>
  )
}
