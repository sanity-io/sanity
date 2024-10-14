import {Flex} from '@sanity/ui'
import {type BundleDocument, RelativeTime, UserAvatar, useTranslation} from 'sanity'

import {releasesLocaleNamespace} from '../../i18n'
import {StatusItem} from '../components/StatusItem'

interface LastEdit {
  author: string
  date: string
}

function getLastEdit(): LastEdit | null {
  /* TODO: Hold until release activity is ready, we will need to use that data to show the last edit done to the release. */
  return null
}

export function ReleaseStatusItems({release}: {release: BundleDocument}) {
  const {t} = useTranslation(releasesLocaleNamespace)

  const lastEdit = getLastEdit()
  return (
    <Flex flex={1} gap={1}>
      {/* Created */}
      {!release.archivedAt && !release.publishedAt && !lastEdit && (
        <StatusItem
          avatar={<UserAvatar size={0} user={release.authorId} />}
          text={
            <>
              {t('footer.status.created')} <RelativeTime time={release._createdAt} />
            </>
          }
        />
      )}

      {/* Edited */}
      {lastEdit && !release.publishedAt && !release.archived && (
        <StatusItem
          avatar={release.publishedBy ? <UserAvatar size={0} user={lastEdit.author} /> : null}
          text={
            <>
              {t('footer.status.edited')} <RelativeTime time={lastEdit.date} />
            </>
          }
        />
      )}

      {/* Published */}
      {release.publishedAt && (
        <StatusItem
          avatar={release.publishedBy ? <UserAvatar size={0} user={release.publishedBy} /> : null}
          text={
            <>
              {t('footer.status.published')} <RelativeTime time={release.publishedAt} />
            </>
          }
        />
      )}

      {/* Archived */}
      {release.archived && release.archivedAt && (
        <StatusItem
          avatar={release.archivedBy ? <UserAvatar size={0} user={release.archivedBy} /> : null}
          text={
            <>
              {t('footer.status.archived')} <RelativeTime time={release.archivedAt} />`
            </>
          }
        />
      )}
    </Flex>
  )
}
