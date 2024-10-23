import {Card, Container, Flex, Heading, Stack} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type RouterContextValue, useRouter} from 'sanity/router'

import {LoadingBlock} from '../../../components'
import {Translate, useTranslation} from '../../../i18n'
import {type ReleaseDocument, useReleases} from '../../../store/release'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleasesRouterState} from '../../types/router'
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
  const {data, loading, deletedReleases} = useReleases()
  const deletedBundle = deletedReleases[releaseId] as ReleaseDocument | undefined

  const {loading: documentsLoading, results} = useBundleDocuments(releaseId)

  const documentIds = results.map((result) => result.document?._id)
  const history = useReleaseHistory(documentIds, releaseId)
  const release = data?.find((storeBundle) => storeBundle._id === releaseId)

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
    if (activeView === 'review' && release?.publishAt) {
      navigateToSummary()
    }
  }, [activeView, release?.publishAt, navigateToSummary])

  const scrollContainerRef = useRef(null)

  const detailContent = useMemo(() => {
    if (deletedBundle) {
      return (
        <Card flex={1} tone="critical">
          <Container width={0}>
            <Stack paddingY={4} space={1}>
              <Heading>
                <Translate
                  t={t}
                  i18nKey="deleted-release"
                  values={{title: deletedBundle.metadata.title}}
                />
              </Heading>
            </Stack>
          </Container>
        </Card>
      )
    }
    if (documentsLoading) {
      return <LoadingBlock title={t('document-loading')} />
    }
    if (!release) return null

    if (activeView === 'summary') {
      return (
        <ReleaseSummary
          documents={results}
          release={release}
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
          release={release}
          documentsHistory={history.documentsHistory}
          scrollContainerRef={scrollContainerRef}
        />
      )
    }
    return null
  }, [activeView, release, deletedBundle, documentsLoading, history.documentsHistory, results, t])

  if (loading) {
    return (
      <LoadingBlock
        title={t('loading-release')}
        fill
        data-testid="release-documents-table-loader"
      />
    )
  }

  const releaseInDetail = (release || deletedBundle) as ReleaseDocument
  if (releaseInDetail) {
    return (
      <Flex direction="column" flex={1} height="fill">
        <Card flex="none" padding={3}>
          <ReleaseDashboardHeader
            release={releaseInDetail}
            inspector={inspector}
            setInspector={setInspector}
          />
        </Card>
        <Card flex="none" borderBottom style={{opacity: 0.6}} />

        <Flex flex={1}>
          <Flex direction="column" flex={1} height="fill">
            <Card flex={1} overflow="auto">
              <ReleaseDashboardDetails release={releaseInDetail} />
              {detailContent}
            </Card>

            <ReleaseDashboardFooter
              documents={results}
              release={releaseInDetail}
              isBundleDeleted={!!deletedBundle}
            />
          </Flex>

          {inspector === 'activity' && (
            <>
              <Card flex="none" borderLeft marginY={2} style={{opacity: 0.6}} />
              <Card flex="none" style={{width: 320}}>
                <ReleaseDashboardActivityPanel />
              </Card>
            </>
          )}
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
