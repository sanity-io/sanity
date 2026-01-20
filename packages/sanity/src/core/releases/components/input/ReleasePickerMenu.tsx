import {type ReleaseDocument} from '@sanity/client'
import {Card, Text} from '@sanity/ui'
import {type JSX, useCallback, useMemo, useRef} from 'react'
import {styled} from 'styled-components'

import {CommandList} from '../../../components/commandList/CommandList'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useAllReleases} from '../../store/useAllReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {ReleasePickerItem} from './ReleasePickerItem'

function isActiveRelease(release: ReleaseDocument): boolean {
  return (
    release.state === 'active' || release.state === 'scheduling' || release.state === 'scheduled'
  )
}
const ITEM_HEIGHT = 33
const MAX_ITEMS = 7

const MenuCard = styled(Card)`
  max-height: ${ITEM_HEIGHT * MAX_ITEMS + 8}px;
  min-width: 220px;
  max-width: 320px;
  padding: 4px 0;
  width: max-content;
`

interface ReleasePickerMenuProps {
  onSelect: (releaseId: string) => void
}

export function ReleasePickerMenu(props: ReleasePickerMenuProps): JSX.Element {
  const {onSelect} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {data: releases, loading, error} = useAllReleases()
  const commandListRef = useRef(null)

  const activeReleases = useMemo(() => releases.filter(isActiveRelease), [releases])

  const renderItem = useCallback(
    (release: ReleaseDocument) => {
      const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
      return <ReleasePickerItem release={release} onSelect={() => onSelect(releaseId)} />
    },
    [onSelect],
  )

  if (loading) {
    return (
      <Card padding={3} shadow={2} radius={2}>
        <Text size={1} muted>
          {t('release-picker.loading')}
        </Text>
      </Card>
    )
  }

  if (error) {
    return (
      <Card padding={3} shadow={2} radius={2} tone="critical">
        <Text size={1}>{t('release-picker.error')}</Text>
      </Card>
    )
  }

  if (activeReleases.length === 0) {
    return (
      <Card padding={3} shadow={2} radius={2}>
        <Text size={1} muted>
          {t('release-picker.empty')}
        </Text>
      </Card>
    )
  }

  return (
    <MenuCard shadow={2} radius={2}>
      <CommandList
        activeItemDataAttr="data-hovered"
        ariaLabel={t('release-picker.aria-label')}
        fixedHeight
        itemHeight={ITEM_HEIGHT}
        items={activeReleases}
        getItemKey={(index) => activeReleases[index]._id}
        padding={0}
        ref={commandListRef}
        renderItem={renderItem}
        canReceiveFocus
        autoFocus="list"
      />
    </MenuCard>
  )
}
