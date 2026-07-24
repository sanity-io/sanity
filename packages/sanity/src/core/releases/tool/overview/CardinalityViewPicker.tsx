import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {useTelemetry} from '@sanity/telemetry/react'
import {Card, Flex, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {
  NavigatedToAllReleases,
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

function getNavigationTelemetryEvent(view: CardinalityView) {
  if (view === 'all') return NavigatedToAllReleases
  if (view === 'drafts') return NavigatedToScheduledDrafts
  return NavigatedToReleasesOverview
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
      const telemetryEvent = getNavigationTelemetryEvent(view)
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

  //  If both are enabled, show them as a segmented-control-style tab group (equal prominence)
  //  rather than a dropdown. This is the primary navigation of the overview, so it's rendered
  //  bigger and bolder than a typical utility control, wrapped in a bordered Card so it reads as
  //  one cohesive switch rather than three loose buttons. The selected tab uses mode="ghost" for
  //  a clearer emphasis than the tonal `selected` highlight alone; unselected tabs stay
  //  mode="bleed".
  return (
    <Card radius={3} border padding={1} data-testid="cardinality-view-picker">
      <Flex align="center" gap={1}>
        <Button
          size="large"
          mode={cardinalityView === 'all' ? 'ghost' : 'bleed'}
          text={t('action.all')}
          selected={cardinalityView === 'all'}
          onClick={handleViewChange('all')}
          disabled={loading}
        />
        <Button
          size="large"
          mode={cardinalityView === 'releases' ? 'ghost' : 'bleed'}
          text={t('action.releases')}
          selected={cardinalityView === 'releases'}
          onClick={handleViewChange('releases')}
          disabled={loading}
        />
        <Button
          size="large"
          mode={cardinalityView === 'drafts' ? 'ghost' : 'bleed'}
          text={t('action.drafts')}
          selected={cardinalityView === 'drafts'}
          onClick={handleViewChange('drafts')}
          disabled={loading}
        />
      </Flex>
    </Card>
  )
}
