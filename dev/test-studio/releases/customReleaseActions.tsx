import {BookIcon} from '@sanity/icons'
import {getReleaseIdFromReleaseDocumentId, type ReleaseActionComponent, useClient} from 'sanity'
import {useRouter} from 'sanity/router'

export const ArchiveAndDeleteCustomAction: ReleaseActionComponent = ({release}) => {
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const sanityClient = useClient({apiVersion: '2025-05-21'})
  const router = useRouter()

  const handleArchiveAndDelete = async () => {
    await sanityClient.releases.archive({releaseId})
    await sanityClient.releases.delete({releaseId})

    // If action was on the release detail, navigate back to release's tool root
    // as once deleted, the release detail page will not exist anymore
    router.navigate({})
  }

  return {
    label: 'Archive and Delete',
    icon: BookIcon,
    disabled: false,
    title: 'Archive and Delete this release',
    onHandle: handleArchiveAndDelete,
  }
}
