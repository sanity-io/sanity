import {BookIcon} from '@sanity/icons'
import {getReleaseIdFromReleaseDocumentId, type ReleaseActionComponent} from 'sanity'

export const logReleaseAction: ReleaseActionComponent = (props) => {
  const {release, documents} = props
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  if (documents.length <= 6) return null

  return {
    label: 'Log Release Info',
    icon: BookIcon,
    disabled: false,
    title: 'Log information about this release to the console',
    onHandle: () => {
      console.group(`Release: ${release.metadata.title}`)
      console.log('Release ID:', releaseId)
      console.log('Release State:', release.state)
      console.log('Release Type:', release.metadata.releaseType)
      console.log('Documents Count:', documents.length)
      console.log(
        'Documents:',
        documents.map((d) => d.document._id),
      )
      console.groupEnd()
    },
  }
}

export const conditionalReleaseAction: ReleaseActionComponent = (props) => {
  const {release, documents} = props

  function getConditionalActionTitle(state: string, documentsLength: number): string {
    if (documentsLength === 0) {
      return 'No documents in release'
    }
    if (state === 'active') {
      return 'This action is available'
    }
    return 'Only available for active releases'
  }

  return {
    label: 'Conditional Action',
    icon: BookIcon,
    disabled: documents.length === 0 || release.state !== 'active',
    title: getConditionalActionTitle(release.state, documents.length),
    onHandle: () => {
      console.log('Conditional action executed!')
    },
  }
}
