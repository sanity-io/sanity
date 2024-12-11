import {Card, Container, Flex, Heading, Stack} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type RouterContextValue, useRouter} from 'sanity/router'

import {LoadingBlock} from '../../../components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleases} from '../../store/useReleases'
import {type ReleasesRouterState} from '../../types/router'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {useReleaseActivity} from './activity/useReleaseActivity'
import {useReleaseHistory} from './documentTable/useReleaseHistory'
import {ReleaseDashboardActivityPanel} from './ReleaseDashboardActivityPanel'
import {ReleaseDashboardDetails} from './ReleaseDashboardDetails'
import {ReleaseDashboardFooter} from './ReleaseDashboardFooter'
import {ReleaseDashboardHeader} from './ReleaseDashboardHeader'
import {ReleaseReview} from './ReleaseReview'
import {ReleaseSummary} from './ReleaseSummary'
import {useBundleDocuments} from './useBundleDocuments'

export type ReleaseInspector = 'activity'

const SUPPORTED_SCREENS = ['summary', 'review'] as const
export type ReleaseView = (typeof SUPPORTED_SCREENS)[number]

const getActiveView = (router: RouterContextValue): ReleaseView => {
  const activeView = Object.fromEntries(router.state._searchParams || []).screen as ReleaseView
  if (typeof activeView !== 'string' || !activeView || !SUPPORTED_SCREENS.includes(activeView)) {
    return 'summary'
  }
  return activeView
}

export const ReleaseDetail = () => {
  const router = useRouter()
  const [inspector, setInspector] = useState<ReleaseInspector | undefined>(undefined)
  const {t} = useTranslation(releasesLocaleNamespace)
  const activeView = getActiveView(router)

  const {releaseId: releaseIdRaw}: ReleasesRouterState = router.state
  const releaseId = decodeURIComponent(releaseIdRaw || '')
  const {data, archivedReleases, loading} = useReleases()

  const {loading: documentsLoading, results} = useBundleDocuments(releaseId)
  const activity = useReleaseActivity(releaseId)

  const documentIds = results.map((result) => result.document?._id)
  const history = useReleaseHistory(documentIds, releaseId)

  const releaseInDetail = data
    .concat(archivedReleases)
    .find((candidate) => getReleaseIdFromReleaseDocumentId(candidate._id) === releaseId)

  const navigateToReview = useCallback(() => {
    router.navigate({
      ...router.state,
      _searchParams: [['screen', 'review']],
    })
  }, [router])

  const navigateToSummary = useCallback(() => {
    router.navigate({
      ...router.state,
      _searchParams: [],
    })
  }, [router])

  // review screen will not be available once published
  // so redirect to summary screen
  useEffect(() => {
    if (activeView === 'review' && releaseInDetail?.publishAt) {
      navigateToSummary()
    }
  }, [activeView, releaseInDetail?.publishAt, navigateToSummary])

  const scrollContainerRef = useRef(null)

  const detailContent = useMemo(() => {
    if (documentsLoading) {
      return <LoadingBlock title={t('document-loading')} />
    }
    if (!releaseInDetail) return null

    if (activeView === 'summary') {
      return (
        <ReleaseSummary
          documents={results}
          release={releaseInDetail}
          documentsHistory={history.documentsHistory}
          scrollContainerRef={scrollContainerRef}
        />
      )
    }
    if (activeView === 'review') {
      // This screen needs to be confirmed, is not part of the prototype yet, maybe it could be removed...
      return (
        <ReleaseReview
          documents={results}
          release={releaseInDetail}
          documentsHistory={history.documentsHistory}
          scrollContainerRef={scrollContainerRef}
        />
      )
    }
    return null
  }, [activeView, releaseInDetail, documentsLoading, history.documentsHistory, results, t])

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

            <ReleaseDashboardFooter
              documents={results}
              release={releaseInDetail}
              events={activity.events}
            />
          </Flex>

          <ReleaseDashboardActivityPanel
            activity={activity}
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
