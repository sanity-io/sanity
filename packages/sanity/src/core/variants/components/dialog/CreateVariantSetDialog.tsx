import {DownloadIcon} from '@sanity/icons/Download'
import {SyncIcon} from '@sanity/icons/Sync'
import {UploadIcon} from '@sanity/icons/Upload'
import {Box, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {type ChangeEvent, type FormEvent, useCallback, useMemo, useRef, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {getVariantConditionsText} from '../../tool/util'
import {type EditableSystemVariant} from '../../types'
import {buildVariantSetDefinitions} from '../../util/buildVariantSetDefinitions'
import {downloadTextFile} from '../../util/downloadTextFile'
import {parseVariantSetJson, serializeVariantSet} from '../../util/variantSetJson'
import {
  countVariantSetPermutations,
  type VariantSetDimension,
} from '../../util/variantSetPermutations'
import {VariantSetExplainer} from '../VariantSetExplainer'
import {VariantSetForm} from './VariantSetForm'

// Above this many permutations, generation asks for an extra confirmation so an accidental
// combinatorial blow-up (a stray dimension) isn't created in one click.
const LARGE_SET_THRESHOLD = 100

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
  const [armedForLargeSet, setArmedForLargeSet] = useState(false)
  // Seed + remount key so importing a JSON file can repopulate the (locally-stateful) form.
  const [formSeed, setFormSeed] = useState<VariantSetDimension[] | undefined>(undefined)
  const [formKey, setFormKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const permutationCount = useMemo(() => countVariantSetPermutations(dimensions), [dimensions])
  const canGenerate = Boolean(name.trim()) && permutationCount > 0 && !dimensionsInvalid
  const isLargeSet = permutationCount > LARGE_SET_THRESHOLD
  const needsConfirmation = isLargeSet && !armedForLargeSet

  const handleDimensionsChange = useCallback((next: VariantSetDimension[]) => {
    setDimensions(next)
    setArmedForLargeSet(false) // any edit re-arms the guardrail
  }, [])

  const handleExport = useCallback(() => {
    const filename = `${name.trim() || 'variant-set'}.json`
    downloadTextFile(filename, serializeVariantSet({name, dimensions}))
  }, [dimensions, name])

  const handleImportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0]
      event.currentTarget.value = '' // allow re-importing the same file
      if (!file) {
        return
      }

      const result = parseVariantSetJson(await file.text())
      if (!result.ok) {
        toast.push({closable: true, status: 'error', title: t('dialog.create-set.import.error')})
        return
      }

      if (result.name) {
        setName(result.name)
      }
      setDimensions(result.dimensions)
      setDimensionsInvalid(false)
      setArmedForLargeSet(false)
      setFormSeed(result.dimensions)
      setFormKey((current) => current + 1)
    },
    [t, toast],
  )

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

      if (needsConfirmation) {
        setArmedForLargeSet(true) // first click on a large set only arms; the next click generates
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
    [canGenerate, createVariant, dimensions, isGenerating, name, needsConfirmation, t, toast],
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
            <VariantSetExplainer />
          </Box>
          <Box paddingBottom={4}>
            <VariantSetForm
              key={formKey}
              initialDimensions={formSeed}
              name={name}
              onDimensionsChange={handleDimensionsChange}
              onDimensionsValidityChange={setDimensionsInvalid}
              onNameChange={setName}
              showValidation={showValidation}
            />
          </Box>

          <input
            accept="application/json,.json"
            data-testid="variant-set-file-input"
            onChange={handleImportFile}
            ref={fileInputRef}
            style={{display: 'none'}}
            type="file"
          />

          <Flex gap={2} paddingBottom={4} wrap="wrap">
            <Button
              data-testid="import-json-button"
              icon={UploadIcon}
              mode="ghost"
              onClick={() => fileInputRef.current?.click()}
              text={t('dialog.create-set.action.import-json')}
              type="button"
            />
            <Button
              data-testid="export-json-button"
              disabled={permutationCount === 0}
              icon={DownloadIcon}
              mode="ghost"
              onClick={handleExport}
              text={t('dialog.create-set.action.export-json')}
              type="button"
            />
            <Button
              data-testid="import-cdp-button"
              disabled
              icon={UploadIcon}
              mode="ghost"
              text={t('dialog.create-set.action.import-cdp')}
              tooltipProps={{content: t('dialog.create-set.cdp.coming-soon')}}
              type="button"
            />
            <Button
              data-testid="sync-cdp-button"
              disabled
              icon={SyncIcon}
              mode="ghost"
              text={t('dialog.create-set.action.sync-cdp')}
              tooltipProps={{content: t('dialog.create-set.cdp.coming-soon')}}
              type="button"
            />
          </Flex>

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

          {isLargeSet && (
            <Box paddingTop={3}>
              <Card border padding={3} radius={2} tone="caution">
                <Text data-testid="variant-set-large-warning" size={1}>
                  {t('dialog.create-set.large-set.warning', {count: permutationCount})}
                </Text>
              </Card>
            </Box>
          )}

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
              text={
                armedForLargeSet
                  ? t('dialog.create-set.action.generate-confirm')
                  : t(
                      permutationCount === 1
                        ? 'dialog.create-set.action.generate_one'
                        : 'dialog.create-set.action.generate_other',
                      {count: permutationCount},
                    )
              }
              tone={isLargeSet ? 'caution' : 'default'}
              type="submit"
            />
          </Flex>
        </form>
      </Card>
    </Dialog>
  )
}
