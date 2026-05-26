import {at, set} from '@sanity/mutate'
import {applyPatches} from '@sanity/mutate/_unstable_apply'
import {Box, Card, Flex, useToast} from '@sanity/ui'
import {toString} from '@sanity/util/paths'
import {type FormEvent, useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {type EditableSystemVariant} from '../../types'
import {getIsVariantInvalid} from '../../util/getIsVariantInvalid'
import {VariantForm, type VariantFormChangeHandler} from './VariantForm'

interface VariantDialogProps {
  confirmDataTestId: string
  confirmText: string
  errorTitle: string
  header: string
  id: string
  initialValue: EditableSystemVariant
  onCancel: () => void
  onSubmit: (variant: EditableSystemVariant) => Promise<void>
  renderCancelButton?: boolean
}

export function VariantDialog(props: VariantDialogProps): React.JSX.Element {
  const {
    confirmDataTestId,
    confirmText,
    errorTitle,
    header,
    id,
    initialValue,
    onCancel,
    onSubmit,
    renderCancelButton = false,
  } = props
  const toast = useToast()
  const {t} = useTranslation(variantsLocaleNamespace)
  const [variant, setVariant] = useState(initialValue)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [conditionsInvalid, setConditionsInvalid] = useState(false)
  const invalid = getIsVariantInvalid(variant) || conditionsInvalid

  const handleVariantChange = useCallback<VariantFormChangeHandler>((path, nextValue) => {
    setVariant(
      (currentVariant) =>
        applyPatches([at(toString(path), set(nextValue))], currentVariant) as EditableSystemVariant,
    )
  }, [])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (invalid) {
        setShowValidation(true)
        return
      }

      setIsSubmitting(true)

      try {
        await onSubmit(variant)
        setIsSubmitting(false)
      } catch (error) {
        setIsSubmitting(false)
        console.error(error)
        toast.push({
          closable: true,
          status: 'error',
          title: errorTitle,
        })
      }
    },
    [errorTitle, invalid, onSubmit, toast, variant],
  )

  return (
    <Dialog
      __unstable_autoFocus={false}
      header={header}
      id={id}
      onClickOutside={isSubmitting ? undefined : onCancel}
      onClose={isSubmitting ? undefined : onCancel}
      padding={false}
      width={1}
    >
      <Card borderTop padding={4}>
        <form onSubmit={handleSubmit}>
          <Box paddingBottom={4}>
            <VariantForm
              onChange={handleVariantChange}
              onConditionValidityChange={setConditionsInvalid}
              showValidation={showValidation}
              value={variant}
            />
          </Box>
          <Flex gap={2} justify="flex-end" paddingTop={5}>
            {renderCancelButton && (
              <Button
                disabled={isSubmitting}
                mode="ghost"
                onClick={onCancel}
                text={t('dialog.edit.action.cancel')}
                type="button"
              />
            )}
            <Button
              data-testid={confirmDataTestId}
              disabled={isSubmitting}
              loading={isSubmitting}
              size="large"
              text={confirmText}
              type="submit"
            />
          </Flex>
        </form>
      </Card>
    </Dialog>
  )
}
