import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useMemo, useRef, useState} from 'react'
import {useRouter} from 'sanity/router'

import {LoadingBlock} from '../../../components'
import {useTranslation} from '../../../i18n'
import {DEFAULT_ORDERING} from '../../../search/search-document-list/constants'
import {useDocumentList} from '../../../search/search-document-list/useDocumentList'
import {releasesLocaleNamespace} from '../../i18n'
import {useActiveReleases} from '../../store/useActiveReleases'
import {useArchivedReleases} from '../../store/useArchivedReleases'
import {type ReleasesRouterState} from '../../types/router'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {useReleaseEvents} from './events/useReleaseEvents'
import {ReleaseDashboardActivityPanel} from './ReleaseDashboardActivityPanel'
import {ReleaseDashboardDetails} from './ReleaseDashboardDetails'
import {ReleaseDashboardFooter} from './ReleaseDashboardFooter'
import {ReleaseDashboardHeader} from './ReleaseDashboardHeader'
import {ReleaseSummary} from './ReleaseSummary'
import {useBundleDocuments} from './useBundleDocuments'

export type ReleaseInspector = 'activity'
const MotionCard = motion.create(Card)

export const ReleaseDetail = () => {
  const router = useRouter()
  const [inspector, setInspector] = useState<ReleaseInspector | undefined>(undefined)
  const {t} = useTranslation(releasesLocaleNamespace)
  const {releaseId: releaseIdRaw}: ReleasesRouterState = router.state
  const releaseId = decodeURIComponent(releaseIdRaw || '')
  const {data, loading} = useActiveReleases()
  const {data: archivedReleases} = useArchivedReleases()

  const {
    loading: documentsLoading,
    //results,
    error: bundleDocumentsError,
  } = useBundleDocuments(releaseId)

  const {items} = useDocumentList({
    apiVersion: '2025-08-28',
    filter: 'sanity::partOfRelease($releaseId)',
    perspective: [releaseId],
    searchQuery: '',
    sortOrder: DEFAULT_ORDERING,
    params: {releaseId},
  })

  const results = items.map((item) => ({
    _id: item._id,
    _type: item._type,
    _system: item._system,
    hasPublished: item.hasPublished,
    _rev: item._rev,
    _updatedAt: item._updatedAt,
  }))

  const releaseEvents = useReleaseEvents(releaseId)

  const releaseInDetail = data
    .concat(archivedReleases)
    .find((candidate) => getReleaseIdFromReleaseDocumentId(candidate._id) === releaseId)

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const detailContent = useMemo(() => {
    if (bundleDocumentsError) {
      return (
        <Box padding={3}>
          <MotionCard
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            tone="critical"
            padding={4}
            radius={4}
          >
            <Flex gap={3}>
              <Text size={1}>
                <ErrorOutlineIcon />
              </Text>
              <Stack space={4}>
                <Text size={1} weight="semibold">
                  {t('loading-release-documents.error.title')}
                </Text>
                <Text size={1}>{t('loading-release-documents.error.description')}</Text>
              </Stack>
            </Flex>
          </MotionCard>
        </Box>
      )
    }
    if (!releaseInDetail) return null

    return (
      <ReleaseSummary
        isLoading={documentsLoading}
        documents={results}
        release={releaseInDetail}
        scrollContainerRef={scrollContainerRef}
      />
    )
  }, [bundleDocumentsError, documentsLoading, releaseInDetail, results, t])

  if (loading) {
    return (
      <LoadingBlock
        title={t('loading-release')}
        fill
        data-testid="release-documents-table-loader"
      />
    )
  }

  if (releaseInDetail) {
    return (
      <Flex direction="column" flex={1} height="fill" overflow="hidden">
        <Card flex="none" padding={3}>
          <ReleaseDashboardHeader
            release={releaseInDetail}
            inspector={inspector}
            setInspector={setInspector}
          />
        </Card>

        <Flex flex={1}>
          <Flex direction="column" flex={1} height="fill">
            <Card flex={1} overflow="auto">
              <ReleaseDashboardDetails release={releaseInDetail} />
              {detailContent}
            </Card>

            <ReleaseDashboardFooter release={releaseInDetail} events={releaseEvents.events} />
          </Flex>

          <ReleaseDashboardActivityPanel
            events={releaseEvents}
            release={releaseInDetail}
            show={inspector === 'activity'}
          />
        </Flex>
      </Flex>
    )
  }

  return (
    <Card flex={1} tone="critical">
      <Container width={0}>
        <Stack paddingX={4} paddingY={6} space={1}>
          <Heading>{t('not-found', {releaseId})}</Heading>
        </Stack>
      </Container>
    </Card>
  )
}
