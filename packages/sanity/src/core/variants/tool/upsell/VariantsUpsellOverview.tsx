import {AddIcon} from '@sanity/icons/Add'
import {useToast} from '@sanity/ui/toast'
import {useCallback} from 'react'
import {Text, Flex} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type VariantsMode} from '../../contexts/mode/types'
import {useVariantsUpsell} from '../../contexts/upsell/useVariantsUpsell'
import {variantsLocaleNamespace} from '../../i18n'
import {VariantsOverviewHeader} from '../overview/VariantsOverviewHeader'
import {VariantsUpsellPanel} from './VariantsUpsellPanel'

/**
 * What the Variants tool renders on every route when the plan lacks content variants (`'upsell'`)
 * or the feature check failed (`null`): the overview header with its create button, and an upsell
 * panel or an unavailable notice where the definitions table would be. It reads no variant data.
 *
 * @internal
 */
export function VariantsUpsellOverview({
  mode,
}: {
  mode: Exclude<VariantsMode, 'default'>
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {t: tStudio} = useTranslation()
  const {handleOpenDialog, upsellDialogOpen} = useVariantsUpsell()
  const toast = useToast()

  const handleCreateVariant = useCallback(() => {
    if (mode === null) {
      // The feature check failed, so whether the plan has variants is unknown: fail closed
      toast.push({
        status: 'error',
        title: tStudio('errors.unable-to-perform-action'),
        closable: true,
      })
      return
    }
    handleOpenDialog()
  }, [handleOpenDialog, mode, tStudio, toast])

  return (
    <Flex flexDirection="column" flexBasis="0%" flexGrow={1} height="100%">
      <VariantsOverviewHeader
        action={
          <Button
            disabled={upsellDialogOpen}
            icon={AddIcon}
            onClick={handleCreateVariant}
            text={t('overview.action.new-variant')}
          />
        }
      />
      <Flex
        alignItems="center"
        flexBasis="0%"
        flexDirection="column"
        flexGrow={1}
        justifyContent="center"
        padding={4}
      >
        {mode === 'upsell' ? (
          <VariantsUpsellPanel />
        ) : (
          <Text data-testid="variants-unavailable" muted size={1} as="div">
            {t('unavailable.text')}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
