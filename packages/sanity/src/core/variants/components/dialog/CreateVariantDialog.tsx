import {Box, Card, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {getIsVariantInvalid} from '../../util/getIsVariantInvalid'
import {getVariantDefaults} from '../../util/variantDefaults'
import {VariantForm} from './VariantForm'

interface CreateVariantDialogProps {
  onCancel: () => void
  onSubmit: (createdVariantId: string) => void
}

export function CreateVariantDialog(props: CreateVariantDialogProps): React.JSX.Element {
  const {onCancel, onSubmit} = props
  const toast = useToast()
  const {t} = useTranslation(variantsLocaleNamespace)
  const {createVariant} = useVariantOperations()
  const [variant, setVariant] = useState(getVariantDefaults)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [conditionsInvalid, setConditionsInvalid] = useState(true)
  const invalid = getIsVariantInvalid(variant) || conditionsInvalid

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (getIsVariantInvalid(variant) || conditionsInvalid) {
        setShowValidation(true)
        return
      }

      setIsSubmitting(true)

      try {
        await createVariant(variant)
        setIsSubmitting(false)
        onSubmit(variant._id)
      } catch (error) {
        setIsSubmitting(false)
        console.error(error)
        toast.push({
          closable: true,
          status: 'error',
          title: t('dialog.create.error.title'),
        })
      }
    },
    [conditionsInvalid, createVariant, onSubmit, t, toast, variant],
  )

  return (
    <Dialog
      __unstable_autoFocus={false}
      header={t('dialog.create.title')}
      id="create-variant-dialog"
      onClickOutside={isSubmitting ? undefined : onCancel}
      onClose={isSubmitting ? undefined : onCancel}
      padding={false}
      width={1}
    >
      <Card borderTop padding={4}>
        <form onSubmit={handleSubmit}>
          <Box paddingBottom={4}>
            <VariantForm
              onChange={setVariant}
              onConditionValidityChange={setConditionsInvalid}
              showValidation={showValidation}
              value={variant}
            />
          </Box>
          <Flex justify="flex-end" paddingTop={5}>
            <Button
              data-testid="submit-variant-button"
              disabled={isSubmitting || invalid}
              loading={isSubmitting}
              size="large"
              text={t('dialog.create.action.confirm')}
              type="submit"
            />
          </Flex>
        </form>
      </Card>
    </Dialog>
  )
}
