import {BookIcon} from '@sanity/icons'
import {getReleaseIdFromReleaseDocumentId, type ReleaseActionComponent} from 'sanity'

// Example custom release action
export const logReleaseAction: ReleaseActionComponent = (props) => {
  const {release, documents} = props
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  if (documents.length <= 6) return null

  return {
    label: 'Log Release Info',
    icon: BookIcon,
    tone: 'primary',
    disabled: false,
    title: 'Log information about this release to the console',
    onHandle: () => {
      console.group(`📋 Release: ${release.metadata.title}`)
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

// Example custom release action that's conditionally disabled
export const conditionalReleaseAction: ReleaseActionComponent = (props) => {
  const {release, documents} = props

  return {
    label: 'Conditional Action',
    icon: BookIcon,
    tone: 'caution',
    disabled: documents.length === 0 || release.state !== 'active',
    title:
      documents.length === 0
        ? 'No documents in release'
        : release.state === 'active'
          ? 'This action is available'
          : 'Only available for active releases',
    onHandle: () => {
      console.log('Conditional action executed!')
    },
  }
}

// The context function now receives both release and documents, allowing
// conditional logic based on document content. For example:
//
// releases: {
//   actions: (prev, ctx) => {
//     // Now ctx has both ctx.release and ctx.documents
//     // You can derive releaseId if needed: getReleaseIdFromReleaseDocumentId(ctx.release._id)
//
//     if (ctx.release.state === 'active' && ctx.documents.length > 5) {
//       return [...prev, logReleaseAction, conditionalReleaseAction]
//     }
//     return prev
//   },
// }
