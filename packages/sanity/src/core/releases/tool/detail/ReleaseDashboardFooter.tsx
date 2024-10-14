import {Card, Flex} from '@sanity/ui'
import {type BundleDocument} from 'sanity'

import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {ReleasePublishAllButton} from '../components/ReleasePublishAllButton/ReleasePublishAllButton'
import {ReleaseStatusItems} from './ReleaseStatusItems'
import {type DocumentInBundleResult} from './useBundleDocuments'

export function ReleaseDashboardFooter(props: {
  documents: DocumentInBundleResult[]
  release: BundleDocument
  isBundleDeleted: boolean
}) {
  const {documents, release, isBundleDeleted} = props

  return (
    <Card flex="none">
      <Card borderTop marginX={2} style={{opacity: 0.6}} />

      <Flex padding={3}>
        <Flex flex={1} gap={1}>
          <ReleaseStatusItems release={release} />
        </Flex>

        <Flex flex="none" gap={1}>
          {/* TODO: Replace this with the real actions. */}
          {!isBundleDeleted && !release.publishedAt && (
            <ReleasePublishAllButton
              bundle={release}
              bundleDocuments={documents}
              disabled={!documents.length}
            />
          )}
          <ReleaseMenuButton disabled={isBundleDeleted} bundle={release} />
        </Flex>
      </Flex>
    </Card>
  )
}
