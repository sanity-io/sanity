import {AddIcon} from '@sanity/icons/Add'
import {type ComponentType} from 'react'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useCreateReleaseAvailability} from '../hooks/useCreateReleaseAvailability'

interface Props {
  onCreateRelease: () => void
}

export const CreateReleaseMenuItem: ComponentType<Props> = ({onCreateRelease}) => {
  const {t} = useTranslation()
  const {disabled, tooltip} = useCreateReleaseAvailability()

  return (
    <MenuItem
      icon={AddIcon}
      onClick={onCreateRelease}
      data-testid="create-new-release-button"
      text={t('release.action.create-new')}
      tooltipProps={{disabled: tooltip === undefined, content: tooltip}}
      disabled={disabled}
    />
  )
}
