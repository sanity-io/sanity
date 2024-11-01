import {Flex} from '@sanity/ui'

import {RelativeTime, UserAvatar} from '../../../components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../index'
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
      {release.state !== 'archived' && !release.publishAt && !lastEdit && (
        <StatusItem
          avatar={<UserAvatar size={0} user={release.createdBy} />}
          text={
            <>
              {t('footer.status.created')}{' '}
              <RelativeTime time={release._createdAt} useTemporalPhrase minimal />
            </>
          }
        />
      )}

      {/* Edited */}
      {lastEdit && !release.publishAt && release.state === 'archived' && (
        <StatusItem
          avatar={lastEdit ? <UserAvatar size={0} user={lastEdit.author} /> : null}
          text={
            <>
              {t('footer.status.edited')}{' '}
              <RelativeTime time={lastEdit.date} minimal useTemporalPhrase />
            </>
          }
        />
      )}
    </Flex>
  )
}
