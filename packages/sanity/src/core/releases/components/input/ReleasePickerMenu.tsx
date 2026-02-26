import {type ReleaseDocument} from '@sanity/client'
import {SearchIcon} from '@sanity/icons'
import {Autocomplete, Box, Card, Flex, Text} from '@sanity/ui'
import {type JSX, type ReactNode, type Ref, useCallback, useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useAllReleases} from '../../store/useAllReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../../util/getReleaseTone'
import {ReleaseAvatar} from '../ReleaseAvatar'

function isActiveRelease(release: ReleaseDocument): boolean {
  return (
    release.state === 'active' || release.state === 'scheduling' || release.state === 'scheduled'
  )
}

interface ReleaseOption {
  value: string
  release: ReleaseDocument
}

const PickerCard = styled(Card)`
  min-width: 280px;
  max-width: 380px;
`

const OptionsContainer = styled.div`
  max-height: 150px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`

interface ReleasePickerMenuProps {
  onSelect: (releaseId: string) => void
  excludeReleaseId?: string
}

export function ReleasePickerMenu(props: ReleasePickerMenuProps): JSX.Element {
  const {onSelect, excludeReleaseId} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {data: releases, loading, error} = useAllReleases()
  const [showAllOptions, setShowAllOptions] = useState(false)

  const activeReleases = useMemo(
    () =>
      releases.filter(
        (release) =>
          isActiveRelease(release) &&
          getReleaseIdFromReleaseDocumentId(release._id) !== excludeReleaseId,
      ),
    [releases, excludeReleaseId],
  )

  const options: ReleaseOption[] = useMemo(
    () =>
      activeReleases.map((release) => ({
        value: getReleaseIdFromReleaseDocumentId(release._id),
        release,
      })),
    [activeReleases],
  )

  const filterOption = useCallback(
    (query: string, option: ReleaseOption) => {
      if (showAllOptions || query === '') return true
      const title = option.release.metadata.title ?? ''
      return title.toLowerCase().includes(query.toLowerCase())
    },
    [showAllOptions],
  )

  const handleQueryChange = useCallback((query: string | null) => {
    if (query) setShowAllOptions(false)
  }, [])

  const handleOpenButtonClick = useCallback(() => {
    setShowAllOptions(true)
  }, [])

  const handleChange = useCallback((value: string) => onSelect(value), [onSelect])

  const renderOption = useCallback((option: ReleaseOption) => {
    const tone = getReleaseTone(option.release)
    return (
      <Card as="button" padding={2}>
        <Flex align="center" gap={2}>
          <ReleaseAvatar tone={tone} fontSize={0} padding={1} />
          <Text size={1}>{option.release.metadata.title || 'Untitled Release'}</Text>
        </Flex>
      </Card>
    )
  }, [])

  const renderPopover = useCallback(
    (
      popoverProps: {
        content: JSX.Element | null
        hidden: boolean
        inputElement: HTMLInputElement | null
        onMouseEnter: () => void
        onMouseLeave: () => void
      },
      contentRef: Ref<HTMLDivElement>,
    ): ReactNode => {
      if (popoverProps.hidden) return null
      return (
        <OptionsContainer
          ref={contentRef as React.RefObject<HTMLDivElement>}
          onMouseEnter={popoverProps.onMouseEnter}
          onMouseLeave={popoverProps.onMouseLeave}
        >
          {popoverProps.content ?? (
            <Box padding={3}>
              <Text size={1} muted>
                {t('release-picker.no-results')}
              </Text>
            </Box>
          )}
        </OptionsContainer>
      )
    },
    [t],
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
    <PickerCard padding={2} radius={2} shadow={2}>
      <Autocomplete
        id="release-picker-autocomplete"
        icon={SearchIcon}
        fontSize={1}
        onChange={handleChange}
        onQueryChange={handleQueryChange}
        openButton={{onClick: handleOpenButtonClick}}
        options={options}
        filterOption={filterOption}
        placeholder={t('release-picker.search-placeholder')}
        renderOption={renderOption}
        renderPopover={renderPopover}
        autoFocus
      />
    </PickerCard>
  )
}
