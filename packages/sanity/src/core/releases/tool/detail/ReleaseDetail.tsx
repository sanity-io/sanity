import {Card, Container, Flex, Heading, Stack} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {LoadingBlock} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'

import {Translate, useTranslation} from '../../../i18n'
import {type BundleDocument, useBundles} from '../../../store/bundles'
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
  const {data, loading, deletedBundles} = useBundles()
  const deletedBundle = deletedBundles[releaseId] as BundleDocument | undefined

  const {loading: documentsLoading, results} = useBundleDocuments(releaseId)

  const documentIds = results.map((result) => result.document?._id)
  const history = useReleaseHistory(documentIds, releaseId)
  const bundle = data?.find((storeBundle) => storeBundle._id === releaseId)

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
    if (activeView === 'review' && bundle?.publishedAt) {
      navigateToSummary()
    }
  }, [activeView, bundle?.publishedAt, navigateToSummary])

  const scrollContainerRef = useRef(null)

  const detailContent = useMemo(() => {
    if (deletedBundle) {
      return (
        <Card flex={1} tone="critical">
          <Container width={0}>
            <Stack paddingY={4} space={1}>
              <Heading>
                <Translate t={t} i18nKey="deleted-release" values={{title: deletedBundle.title}} />
              </Heading>
            </Stack>
          </Container>
        </Card>
      )
    }
    if (documentsLoading) {
      return <LoadingBlock title={t('document-loading')} />
    }
    if (!bundle) return null

    if (activeView === 'summary') {
      return (
        <ReleaseSummary
          documents={results}
          release={bundle}
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
          release={bundle}
          documentsHistory={history.documentsHistory}
          scrollContainerRef={scrollContainerRef}
        />
      )
    }
    return null
  }, [activeView, bundle, deletedBundle, documentsLoading, history.documentsHistory, results, t])

  if (loading) {
    return (
      <LoadingBlock title={t('loading-release')} fill data-testid="bundle-documents-table-loader" />
    )
  }

  const bundleInDetail = (bundle || deletedBundle) as BundleDocument
  if (bundleInDetail) {
    return (
      <Flex direction="column" flex={1} height="fill">
        <Card flex="none" padding={3}>
          <ReleaseDashboardHeader
            release={bundleInDetail}
            inspector={inspector}
            setInspector={setInspector}
          />
        </Card>
        <Card flex="none" borderBottom style={{opacity: 0.6}} />

        <Flex flex={1}>
          <Flex direction="column" flex={1} height="fill">
            <Card flex={1} overflow="auto">
              <ReleaseDashboardDetails release={bundleInDetail} />
              {detailContent}
            </Card>

            <ReleaseDashboardFooter
              documents={results}
              release={bundleInDetail}
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
