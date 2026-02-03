import {StarFilledIcon, StarIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {type ComponentType} from 'react'
import {useManageFavorite, type UseManageFavoriteProps, useTranslation} from 'sanity'

import {Button} from '../../../../../ui-components/button/Button'
import {structureLocaleNamespace} from '../../../../i18n'

export const FavoriteToggle: ComponentType<UseManageFavoriteProps & {documentExists: boolean}> = ({
  documentExists,
  ...props
}) => {
  const {isFavorited, isReady, favorite, unfavorite} = useManageFavorite(props)
  const {t} = useTranslation(structureLocaleNamespace)

  const description = t(
    isFavorited
      ? 'document.favorites.remove-from-favorites'
      : 'document.favorites.add-to-favorites',
  )

  return (
    <Button
      mode="bleed"
      onClick={isFavorited ? unfavorite : favorite}
      disabled={!isReady || !documentExists}
      aria-label={description}
      aria-live="assertive"
      tooltipProps={{
        content: <Text size={1}>{description}</Text>,
        placement: 'right',
      }}
    >
      <Text size={1}>{isFavorited ? <StarFilledIcon /> : <StarIcon />}</Text>
    </Button>
  )
}
