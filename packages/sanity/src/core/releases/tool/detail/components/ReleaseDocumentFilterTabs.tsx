import {type ReleaseState} from '@sanity/client'
import {Box, Container, Flex, Skeleton, TabList} from '@sanity/ui'
import {useMemo} from 'react'

import {Tab} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {
  countDocumentsByAction,
  type DocumentFilterType,
  FILTER_TAB_CONFIGS,
  type FilterTabConfig,
} from '../releaseDocumentActions'
import {type DocumentInRelease} from '../useBundleDocuments'

interface ReleaseDocumentFilterTabsProps {
  documents: DocumentInRelease[]
  releaseState: ReleaseState
  isLoading?: boolean
  activeFilter: DocumentFilterType
  onFilterChange: (filter: DocumentFilterType) => void
}

export function ReleaseDocumentFilterTabs({
  documents,
  releaseState,
  isLoading = false,
  activeFilter,
  onFilterChange,
}: ReleaseDocumentFilterTabsProps) {
  const {t} = useTranslation(releasesLocaleNamespace)

  // Hide filter tabs for archived and published releases (early return for perf)
  if (releaseState === 'archived' || releaseState === 'published') {
    return null
  }

  if (isLoading) {
    return (
      <Container width={3}>
        <Box padding={3}>
          <Flex align="center" gap={2}>
            {FILTER_TAB_CONFIGS.filter((config) => config.key !== 'errors').map((config) => (
              <Skeleton
                key={`loading-skeleton-${config.key}`}
                animated
                style={{width: '70px', height: '32px'}}
                radius={2}
              />
            ))}
          </Flex>
        </Box>
      </Container>
    )
  }

  if (documents.length === 0) {
    return null
  }

  return (
    <ReleaseDocumentFilterTabsInner
      documents={documents}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
      t={t}
    />
  )
}

interface ReleaseDocumentFilterTabsInnerProps {
  documents: DocumentInRelease[]
  activeFilter: DocumentFilterType
  onFilterChange: (filter: DocumentFilterType) => void
  t: ReturnType<typeof useTranslation>['t']
}

function ReleaseDocumentFilterTabsInner({
  documents,
  activeFilter,
  onFilterChange,
  t,
}: ReleaseDocumentFilterTabsInnerProps) {
  const counts = useMemo(() => countDocumentsByAction(documents), [documents])

  const getTabLabel = (config: FilterTabConfig): string => {
    const label = t(config.labelKey)
    if (config.key === 'all') {
      return label
    }
    const count = counts[config.key]
    return `${label} (${count})`
  }

  const getTabTone = (config: FilterTabConfig): 'default' | 'positive' | 'caution' | 'critical' => {
    // Errors tab always uses critical tone for visibility (both selected and unselected)
    if (config.key === 'errors') {
      return 'critical'
    }
    // Only apply action-specific tones when selected
    if (activeFilter === config.key) {
      return config.tone
    }
    return 'default'
  }

  return (
    <Container width={3}>
      <Box padding={3}>
        <TabList space={1}>
          {FILTER_TAB_CONFIGS.map((config) => {
            const isSelected = activeFilter === config.key

            // Hide tabs with zero counts (except "All")
            if (config.key !== 'all' && counts[config.key] === 0) {
              return null
            }

            return (
              <Tab
                key={config.key}
                id={`filter-tab-${config.key}`}
                aria-controls="document-table-card"
                label={getTabLabel(config)}
                onClick={() => onFilterChange(config.key)}
                selected={isSelected}
                tone={getTabTone(config)}
              />
            )
          })}
        </TabList>
      </Box>
    </Container>
  )
}
