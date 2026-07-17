import {Box, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useMemo, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {getVariantConditionsText} from '../../tool/util'
import {type EditableSystemVariant} from '../../types'
import {buildVariantSetDefinitions} from '../../util/buildVariantSetDefinitions'
import {
  countVariantSetPermutations,
  type VariantSetDimension,
} from '../../util/variantSetPermutations'
import {VariantSetForm} from './VariantSetForm'

interface CreateVariantSetDialogProps {
  onCancel: () => void
  onDone: () => void
}

export function CreateVariantSetDialog(props: CreateVariantSetDialogProps): React.JSX.Element {
  const {onCancel, onDone} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const {createVariant} = useVariantOperations()

  const [name, setName] = useState('')
  const [dimensions, setDimensions] = useState<VariantSetDimension[]>([])
  const [dimensionsInvalid, setDimensionsInvalid] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState<EditableSystemVariant[] | null>(null)

  const permutationCount = useMemo(() => countVariantSetPermutations(dimensions), [dimensions])
  const canGenerate = Boolean(name.trim()) && permutationCount > 0 && !dimensionsInvalid

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (isGenerating) {
        return
      }

      if (!canGenerate) {
        setShowValidation(true)
        return
      }

      const {definitions} = buildVariantSetDefinitions({name, dimensions})
      setIsGenerating(true)

      try {
        // No batch action exists, so each generated definition is created individually. This is
        // not transactional: if one fails, earlier ones remain. Acceptable for now, since the
        // permutation preview discourages very large sets.
        await Promise.all(definitions.map((definition) => createVariant(definition)))
        setGenerated(definitions)
      } catch (error) {
        console.error(error)
        toast.push({
          closable: true,
          status: 'error',
          title: t('dialog.create-set.error.title'),
        })
      } finally {
        setIsGenerating(false)
      }
    },
    [canGenerate, createVariant, dimensions, isGenerating, name, t, toast],
  )

  if (generated) {
    return (
      <Dialog
        __unstable_autoFocus={false}
        header={t('dialog.create-set.title')}
        id="create-variant-set-dialog"
        onClickOutside={onDone}
        onClose={onDone}
        padding={false}
        width={1}
      >
        <Card borderTop padding={4}>
          <Stack space={4}>
            <Stack space={2}>
              <Text data-testid="variant-set-result-title" size={1} weight="semibold">
                {t(
                  generated.length === 1
                    ? 'dialog.create-set.result.title_one'
                    : 'dialog.create-set.result.title_other',
                  {count: generated.length},
                )}
              </Text>
              <Text muted size={1}>
                {t('dialog.create-set.result.description')}
              </Text>
            </Stack>

            <Card border padding={1} radius={2}>
              <Box style={{maxHeight: 280, overflowY: 'auto'}}>
                <Stack data-testid="variant-set-result-list" space={1}>
                  {generated.map((definition) => (
                    <Card key={definition._id} padding={3} radius={2}>
                      <Stack space={2}>
                        <Text size={1} weight="medium">
                          {definition.metadata?.title}
                        </Text>
                        <Text muted size={1}>
                          {getVariantConditionsText(definition.conditions)}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Card>

            <Flex justify="flex-end">
              <Button
                data-testid="variant-set-done-button"
                onClick={onDone}
                size="large"
                text={t('dialog.create-set.action.done')}
              />
            </Flex>
          </Stack>
        </Card>
      </Dialog>
    )
  }

  return (
    <Dialog
      __unstable_autoFocus={false}
      header={t('dialog.create-set.title')}
      id="create-variant-set-dialog"
      onClickOutside={isGenerating ? undefined : onCancel}
      onClose={isGenerating ? undefined : onCancel}
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
              disabled={isGenerating}
              mode="ghost"
              onClick={onCancel}
              text={t('dialog.create-set.action.cancel')}
              type="button"
            />
            <Button
              data-testid="generate-variant-set-button"
              disabled={!canGenerate || isGenerating}
              loading={isGenerating}
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
