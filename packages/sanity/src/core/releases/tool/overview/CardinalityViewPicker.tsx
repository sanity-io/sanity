import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, ChevronDownIcon} from '@sanity/icons'
import {Flex, Menu, Text} from '@sanity/ui'
import {useMemo} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton'
import {MenuItem} from '../../../../ui-components/menuItem'
import {useTranslation} from '../../../i18n'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {releasesLocaleNamespace} from '../../i18n'
import {type CardinalityView} from './queryParamUtils'

interface CardinalityViewPickerProps {
  cardinalityView: CardinalityView
  loading: boolean
  isScheduledDraftsEnabled: boolean
  isDraftModelEnabled: boolean
  allReleases: ReleaseDocument[]
  onCardinalityViewChange: (view: CardinalityView) => () => void
}

export const CardinalityViewPicker = ({
  cardinalityView,
  loading,
  isScheduledDraftsEnabled,
  isDraftModelEnabled,
  allReleases,
  onCardinalityViewChange,
}: CardinalityViewPickerProps) => {
  const {t} = useTranslation(releasesLocaleNamespace)

  const renderCardinalityMenuButton = useMemo(() => {
    const currentViewText =
      cardinalityView === 'releases' ? t('action.releases') : t('action.drafts')

    return (
      <MenuButton
        id="cardinality-view-menu"
        button={
          <Button
            mode="bleed"
            paddingY={2}
            text={currentViewText}
            icon={CalendarIcon}
            iconRight={ChevronDownIcon}
            disabled={loading}
            style={{fontWeight: 600}}
          />
        }
        menu={
          <Menu>
            <MenuItem
              text={t('action.releases')}
              selected={cardinalityView === 'releases'}
              onClick={onCardinalityViewChange('releases')}
            />
            <MenuItem
              text={t('action.drafts')}
              selected={cardinalityView === 'drafts'}
              onClick={onCardinalityViewChange('drafts')}
            />
          </Menu>
        }
      />
    )
  }, [cardinalityView, loading, t, onCardinalityViewChange])

  const renderReleasesLabel = useMemo(
    () => (
      <Flex align="center" gap={2}>
        <CalendarIcon />
        <Text size={1} weight="semibold">
          {t('action.releases')}
        </Text>
      </Flex>
    ),
    [t],
  )

  const hasActiveCardinalityOneReleases = useMemo(
    () => allReleases.some(isCardinalityOneRelease),
    [allReleases],
  )

  if (!isScheduledDraftsEnabled) {
    if (!hasActiveCardinalityOneReleases) {
      return renderReleasesLabel
    }
    return renderCardinalityMenuButton
  }

  // When scheduled drafts are enabled, we need to check if drafts mode is also enabled
  // If drafts mode is disabled, only show releases and drafts menu items if there are any cardinality one releases
  // otherwise, show only the releases label
  if (!isDraftModelEnabled) {
    if (!hasActiveCardinalityOneReleases) {
      return renderReleasesLabel
    }
  }

  return renderCardinalityMenuButton
}
