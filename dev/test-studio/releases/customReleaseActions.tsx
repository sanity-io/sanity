import {BookIcon, DocumentIcon, EyeOpenIcon, ListIcon, TrashIcon} from '@sanity/icons'
import {getReleaseIdFromReleaseDocumentId, type ReleaseActionComponent, useClient} from 'sanity'

// Import the hook directly for testing
import {useReleaseActionContext} from '../../../packages/sanity/src/core/releases/hooks'

/**
 * Example 1: Action with NO group specified - appears in both contexts by default
 *
 * This action demonstrates the new default behavior where actions without
 * a group property will automatically appear in both list and detail views.
 */
export const DefaultBehaviorAction: ReleaseActionComponent = ({release}) => {
  const handleDefaultAction = () => {
    console.log('This action appears everywhere by default:', release.metadata.title)
  }

  return {
    label: 'Default Action',
    icon: TrashIcon,
    disabled: false,
    title: 'This action appears in both contexts by default',
    onHandle: handleDefaultAction,
    // No group specified - will appear in both list and detail contexts
  }
}

/**
 * Example 2: Action that appears in multiple contexts with the same behavior
 *
 * This action explicitly specifies both contexts, which is equivalent to
 * not specifying a group at all (but more explicit).
 */
export const ArchiveAndDeleteCustomAction: ReleaseActionComponent = ({release}) => {
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const sanityClient = useClient({apiVersion: '2025-05-21'})

  const handleArchiveAndDelete = async () => {
    await sanityClient.releases.archive({releaseId})
    await sanityClient.releases.delete({releaseId})
  }

  return {
    label: 'Archive and Delete',
    icon: BookIcon,
    disabled: false,
    title: 'Archive and Delete this release',
    onHandle: handleArchiveAndDelete,
    // Explicitly specify both contexts (same as not specifying group)
    group: ['list', 'detail'],
  }
}

/**
 * Example 3: Action that only appears in the list context
 *
 * This action will ONLY appear in the release overview/list view,
 * not in the detailed release view.
 */
export const QuickViewAction: ReleaseActionComponent = ({release}) => {
  const handleQuickView = () => {
    console.log('Quick view:', release.metadata.title)
  }

  return {
    label: 'Quick View',
    icon: ListIcon,
    disabled: false,
    title: 'Quick preview of release',
    onHandle: handleQuickView,
    // This action only appears in the list context
    group: ['list'],
  }
}

/**
 * Example 4: Action that only appears in the detail context
 *
 * This action will ONLY appear in the detailed release view,
 * not in the release overview/list. It has access to full document data.
 */
export const DetailedReportAction: ReleaseActionComponent = ({release, documents}) => {
  const handleGenerateReport = () => {
    console.log(
      'Generating detailed report for:',
      release.metadata.title,
      'with',
      documents.length,
      'documents',
    )
  }

  return {
    label: 'Generate Report',
    icon: DocumentIcon,
    disabled: documents.length === 0,
    title: 'Generate detailed report with all document information',
    onHandle: handleGenerateReport,
    // This action only appears in the detail context where full document data is available
    group: ['detail'],
  }
}

/**
 * Example 5: Context-aware action that changes behavior based on where it's rendered
 *
 * This action appears in both contexts BUT:
 * - In the list context: shows as "Quick Preview" with different behavior
 * - In the detail context: shows as "Deep Analysis" with different behavior
 *
 * This demonstrates how you can create adaptive actions that provide
 * context-appropriate functionality using the useReleaseActionContext hook.
 */
export const ContextAwareViewAction: ReleaseActionComponent = ({release, documents}) => {
  const {group: context} = useReleaseActionContext()

  const handleView = () => {
    if (context === 'list') {
      console.log('Quick preview from list view:', release.metadata.title)
      // Could open a modal or navigate to a quick preview
    } else if (context === 'detail') {
      console.log(
        'Deep dive analysis from detail view:',
        release.metadata.title,
        'with',
        documents.length,
        'documents',
      )
      // Could generate detailed analytics or reports
    }
  }

  // Different label and behavior based on context
  if (context === 'list') {
    return {
      label: 'Quick Preview',
      icon: EyeOpenIcon,
      disabled: false,
      title: 'Quick preview of this release',
      onHandle: handleView,
      group: ['list', 'detail'], // Appears in both contexts
    }
  }

  if (context === 'detail') {
    return {
      label: 'Deep Analysis', // Different label in detail view
      icon: DocumentIcon, // Different icon in detail view
      disabled: documents.length === 0,
      title: 'Perform deep analysis with full document data',
      onHandle: handleView,
      group: ['list', 'detail'], // Appears in both contexts
    }
  }

  // Fallback (shouldn't happen with proper group filtering, but good practice)
  return {
    label: 'View',
    icon: EyeOpenIcon,
    disabled: false,
    title: 'View release',
    onHandle: handleView,
    group: ['list', 'detail'],
  }
}
