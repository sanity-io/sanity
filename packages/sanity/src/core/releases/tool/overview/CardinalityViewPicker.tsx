import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {
  NavigatedToReleasesOverview,
  NavigatedToScheduledDrafts,
} from '../../__telemetry__/navigation.telemetry'
import {releasesLocaleNamespace} from '../../i18n'
import {type CardinalityView} from './queryParamUtils'

interface CardinalityViewPickerProps {
  cardinalityView: CardinalityView
  loading: boolean
  isScheduledDraftsEnabled: boolean
  isDraftModelEnabled: boolean
  isReleasesEnabled: boolean
  allReleases: ReleaseDocument[]
  onCardinalityViewChange: (view: CardinalityView) => () => void
}

const getPickerView = ({
  hasSingleDocRelease,
  isScheduledDraftsEnabled,
  isReleasesEnabled,
  cardinalityView,
  isDraftModelEnabled,
}: {
  hasSingleDocRelease: boolean
  isScheduledDraftsEnabled: boolean
  isReleasesEnabled: boolean
  cardinalityView: CardinalityView
  isDraftModelEnabled: boolean
}): 'contentReleases' | 'singleDocReleases' | 'both' => {
  if (isReleasesEnabled) {
    if (hasSingleDocRelease || (isScheduledDraftsEnabled && isDraftModelEnabled)) return 'both'
    return cardinalityView === 'drafts' ? 'both' : 'contentReleases'
  }

  return cardinalityView === 'releases' ? 'both' : 'singleDocReleases'
}

export const CardinalityViewPicker = ({
  cardinalityView,
  loading,
  isScheduledDraftsEnabled,
  isReleasesEnabled,
  isDraftModelEnabled,
  allReleases,
  onCardinalityViewChange,
}: CardinalityViewPickerProps) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const hasSingleDocRelease = useMemo(
    () => allReleases.some(isCardinalityOneRelease),
    [allReleases],
  )

  const pickerView = getPickerView({
    hasSingleDocRelease,
    isScheduledDraftsEnabled,
    isReleasesEnabled,
    cardinalityView,
    isDraftModelEnabled,
  })

  const handleViewChange = useCallback(
    (view: CardinalityView) => () => {
      const telemetryEvent =
        view === 'releases' ? NavigatedToReleasesOverview : NavigatedToScheduledDrafts
      telemetry.log(telemetryEvent, {source: 'view-picker'})

      onCardinalityViewChange(view)()
    },
    [telemetry, onCardinalityViewChange],
  )

  //  If only one is enabled, show the label
  if (pickerView === 'contentReleases' || pickerView === 'singleDocReleases') {
    return (
      <Flex align="center" gap={2}>
        <CalendarIcon />
        <Text size={1} weight="semibold">
          {pickerView === 'contentReleases' ? t('action.releases') : t('action.drafts')}
        </Text>
      </Flex>
    )
  }

  //  If both are enabled, show them as side-by-side tabs (equal prominence) rather than a dropdown.
  return (
    <Flex align="center" gap={1}>
      <Button
        mode="bleed"
        paddingY={2}
        text={t('action.releases')}
        selected={cardinalityView === 'releases'}
        onClick={handleViewChange('releases')}
        disabled={loading}
      />
      <Button
        mode="bleed"
        paddingY={2}
        text={t('action.drafts')}
        selected={cardinalityView === 'drafts'}
        onClick={handleViewChange('drafts')}
        disabled={loading}
      />
    </Flex>
  )
}
