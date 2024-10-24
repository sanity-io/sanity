import {Flex} from '@sanity/ui'

import {RelativeTime, UserAvatar} from '../../../components'
import {useTranslation} from '../../../i18n'
import {type ReleaseDocument} from '../../../store'
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

export function ReleaseStatusItems({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation(releasesLocaleNamespace)

  const lastEdit = getLastEdit()
  return (
    <Flex flex={1} gap={1}>
      {/* Created */}
      {!release.metadata.archivedAt && !release.publishAt && !lastEdit && (
        <StatusItem
          avatar={<UserAvatar size={0} user={release.createdBy} />}
          text={
            <>
              {t('footer.status.edited')}{' '}
              <RelativeTime time={release._updatedAt} useTemporalPhrase minimal />
            </>
          }
        />
      )}

      {/* Edited */}
      {lastEdit && !release.publishAt && release.state === 'archived' && (
        <StatusItem
          avatar={
            release.metadata.publishedBy ? <UserAvatar size={0} user={lastEdit.author} /> : null
          }
          text={
            <>
              {t('footer.status.edited')} <RelativeTime time={lastEdit.date} />
            </>
          }
        />
      )}

      {/* Published */}
      {release.publishAt && (
        <StatusItem
          avatar={
            release.metadata.publishedBy ? (
              <UserAvatar size={0} user={release.metadata.publishedBy} />
            ) : null
          }
          text={
            <>
              {t('footer.status.published')} <RelativeTime time={release.publishAt} />
            </>
          }
        />
      )}

      {/* Archived */}
      {release.state === 'archived' && release.metadata.archivedAt && (
        <StatusItem
          avatar={
            release.metadata.archivedBy ? (
              <UserAvatar size={0} user={release.metadata.archivedBy} />
            ) : null
          }
          text={
            <>
              {t('footer.status.archived')} <RelativeTime time={release.metadata.archivedAt} />`
            </>
          }
        />
      )}
    </Flex>
  )
}
