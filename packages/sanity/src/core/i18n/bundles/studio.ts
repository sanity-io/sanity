import {defineLocaleResourceBundle} from '../helpers'
import {studioLocaleNamespace} from '../localeNamespaces'

/**
 * The string resources for the studio core.
 *
 * @internal
 */
export const studioLocaleStrings = {
  /** Placeholder text for the omnisearch input field */
  'navbar.search.placeholder': 'Search',

  /* Relative time, just now */
  'timeAgo.justNow': 'just now',

  /* Relative time, granularity: weeks*/
  'timeAgo.weeks_one': '{{count}} week',
  'timeAgo.weeks_other': '{{count}} weeks',
  /* Relative time, granularity: weeks, configured to show ago suffix*/
  'timeAgo.weeks.ago_one': '{{count}} week ago',
  'timeAgo.weeks.ago_other': '{{count}} weeks ago',
  /* Relative time, granularity: count, using a minimal format*/
  'timeAgo.weeks.minimal': '{{count}}w',
  /* Relative time, granularity: weeks, using a minimal format, configured to show ago suffix*/
  'timeAgo.weeks.minimal.ago': '{{count}}w ago',

  /* Relative time, granularity: days*/
  'timeAgo.days_one': 'yesterday',
  'timeAgo.days_other': '{{count}} days',
  /* Relative time, granularity: days, configured to show ago suffix*/
  'timeAgo.days.ago_one': 'yesterday',
  'timeAgo.days.ago_other': '{{count}} days ago',
  /* Relative time, granularity: days, using a minimal format*/
  'timeAgo.days.minimal_one': 'yesterday',
  'timeAgo.days.minimal_other': '{{count}}d',
  /* Relative time, granularity: days, using a minimal format, configured to show ago suffix*/
  'timeAgo.days.minimal.ago': '{{count}}d ago',

  /* Relative time, granularity: hours*/
  'timeAgo.hours_one': '{{count}} hour',
  'timeAgo.hours_other': '{{count}} hours',
  /* Relative time, granularity: hours, configured to show ago suffix*/
  'timeAgo.hours.ago_one': '{{count}} hour ago',
  'timeAgo.hours.ago_other': '{{count}} hours ago',
  /* Relative time, granularity: hours, using a minimal format*/
  'timeAgo.hours.minimal': '{{count}}h',
  /* Relative time, granularity: hours, using a minimal format, configured to show ago suffix*/
  'timeAgo.hours.minimal.ago': '{{count}}h ago',

  /* Relative time, granularity: minutes*/
  'timeAgo.minutes_one': '{{count}} minute',
  'timeAgo.minutes_other': '{{count}} minutes',
  /* Relative time, granularity: minutes, configured to show ago suffix*/
  'timeAgo.minutes.ago_one': '{{count}} minute ago',
  'timeAgo.minutes.ago_other': '{{count}} minutes ago',
  /* Relative time, granularity: minutes, using a minimal format*/
  'timeAgo.minutes.minimal': '{{count}}m',
  /* Relative time, granularity: minutes, using a minimal format, configured to show ago suffix*/
  'timeAgo.minutes.minimal.ago': '{{count}}m ago',

  /* Relative time, granularity: seconds*/
  'timeAgo.seconds_one': '{{count}} second',
  'timeAgo.seconds_other': '{{count}} seconds',
  /* Relative time, granularity: seconds, configured to show ago suffix*/
  'timeAgo.seconds.ago_one': '{{count}} minute ago',
  'timeAgo.seconds.ago_other': '{{count}} second ago',
  /* Relative time, granularity: seconds, using a minimal format*/
  'timeAgo.seconds.minimal': '{{count}}m',
  /* Relative time, granularity: seconds, using a minimal format, configured to show ago suffix*/
  'timeAgo.seconds.minimal.ago': '{{count}}m ago',

  /** --- Review Changes --- */

  /** Title for the Review Changes pane */
  'changes.title': 'Review changes',

  /** Label for the close button label in Review Changes pane */
  'changes.action.close-label': 'Close review changes',

  /** Label and text for differences tooltip that indicates the authors of the changes */
  'changes.changes-by-author': 'Changes by',

  /** Loading changes in Review Changes Pane */
  'changes.loading-changes': 'Loading changes',

  /** No Changes title in the Review Changes pane */
  'changes.no-changes-title': 'There are no changes',

  /** No Changes description in the Review Changes pane */
  'changes.no-changes-description':
    'Edit the document or select an older version in the timeline to see a list of changes appear in this panel.',

  /** Prompt for reverting all changes in document in Review Changes pane. Includes a count of changes. */
  'changes.action.revert-all-description': `Are you sure you want to revert all {{count}} changes?`,

  /** Cancel label for revert button prompt action */
  'changes.action.revert-all-cancel': `Cancel`,

  /** Revert all confirm label for revert button action - used on prompt button + review changes pane */
  'changes.action.revert-all-confirm': `Revert all`,

  /** Loading author of change in the differences tooltip in the review changes pane */
  'changes.loading-author': 'Loading…',

  /** --- Review Changes: Field + Group --- */

  /** Prompt for reverting changes for a field change */
  'changes.action.revert-changes-description': `Are you sure you want to revert the changes?`,

  /** Prompt for reverting changes for a group change, eg multiple changes */
  'changes.action.revert-changes-description_one': `Are you sure you want to revert the change?`,

  /** Prompt for confirming revert change (singular) label for field change action */
  'changes.action.revert-changes-confirm-change_one': `Revert change`,

  /** Revert for confirming revert (plural) label for field change action */
  'changes.action.revert-changes-confirm-change_other': `Revert changes`,

  /** --- Document timeline, for navigating different revisions of a document --- */

  /** Error prompt when revision cannot be loaded */
  'timeline.error.unable-to-load-revision': 'Unable to load revision',

  /** Label for latest version for timeline menu dropdown */
  'timeline.latest-version': 'Latest version',

  /** Label for loading history */
  'timeline.loading-history': 'Loading history',

  /** Label for determining since which version the changes for timeline menu dropdown are showing.
   * Receives the time label as a parameter.
   */
  'timeline.since': 'Since: {{timestamp, datetime}}',

  /** Label for missing change version for timeline menu dropdown are showing */
  'timeline.since-version-missing': 'Since: unknown version',

  /** Title for error when the timeline for the given document can't be loaded */
  'timeline.error.load-document-changes-title':
    'An error occurred whilst retrieving document changes.',

  /** Description for error when the timeline for the given document can't be loaded */
  'timeline.error.load-document-changes-description':
    'Document history transactions have not been affected.',

  /** Error title for when the document doesn't have history */
  'timeline.error.no-document-history-title': 'No document history',

  /** Error description for when the document doesn't have history */
  'timeline.error.no-document-history-description':
    'When changing the content of the document, the document versions will appear in this menu.',

  /** --- Timeline constants --- */

  /** Label for when the timeline item is the latest in the history */
  'timeline.latest': 'Latest',

  /** Consts used in the timeline item component (dropdown menu) - helpers */
  'timeline.create': 'Created',
  'timeline.delete': 'Deleted',
  'timeline.discardDraft': 'Discarded draft',
  'timeline.initial': 'Created',
  'timeline.editDraft': 'Edited',
  'timeline.editLive': 'Live edited',
  'timeline.publish': 'Published',
  'timeline.unpublish': 'Unpublished',

  /** --- Slug Input --- */

  /** Error message for when the source to generate a slug from is missing */
  'inputs.slug.error.missing-source': `Source is missing. Check source on type {{schemaType}} in schema`,

  /** Loading message for when the input is actively generating a slug */
  'inputs.slug.action.generating': `Generating…`,

  /** Action message for generating the slug */
  'inputs.slug.action.generate': `Generate`,

  /** --- Nav bar --- */

  /** Label for workspace picker */
  'navbar.action.select-workspace': 'Select workspace',

  /** Label to open search action when the search is on full screen */
  'navbar.action.open-search': 'Open search',

  /** --- Worksace menu --- */

  /** Title for Workplaces dropdown menu */
  'navbar.workspace-menu.title': 'Workspaces',

  /** Title for "community" link within the workspace menu */
  'navbar.workspace-menu.community-title': 'Community',

  /** Title for "docs" link within the workspace menu */
  'navbar.workspace-menu.docs-title': 'Docs',

  /** Title for "privacy" link within the workspace menu */
  'navbar.workspace-menu.privacy-title': 'Privacy',

  /** Title for "sanity io website" link within the workspace menu */
  'navbar.workspace-menu.sanity-io-title': 'sanity.io',

  /** Label for area section that indicates that you can choose your workspace */
  'navbar.workspace-menu.choose-your-workspace-label': 'Choose your workspace',

  /** Label for action to choose a different workspace */
  'navbar.workspace-menu.action.choose-another-workspace': 'Choose another workspace',

  /** Label for action to add a workspace */
  'navbar.workspace-menu.action.add-workspace': 'Add workspace',

  /** --- New Document --- */

  /** Placeholder for the "search" input within the new document menu */
  'navbar.new-document.search': 'Search',

  /** Loading indicator text within the new document menu */
  'navbar.new-document.loading': 'Loading…',

  /** Title for "Create new document" Also used for accessibility */
  'navbar.new-document.title': 'Create new document',

  /** Label for when no document types are found when searching them in the new document menu */
  'navbar.new-document.no-document-types': 'No document types',

  /** Label for "Create new document" action */
  'navbar.new-document.action.create-new-document': 'New document...',

  /** Message for when no results are found for a specific search query in the new document menu */
  'navbar.new-document.no-results': 'No results for',

  /** Message for when there are no document options in the new document menu */
  'navbar.new-document.no-documents-found': 'No documents found',

  /** Accessibility label for options in the new document menu */
  'nav-bar.new-document.new-document': 'New document',

  /** Error label for when a user is unable to create a document */
  'nav-bar.new-document.error.unable-to-create-document': 'create this document',

  /** --- Search --- */

  /** Accessibility label for Search Input for when there are no recent searches */
  'navbar.search.search-results-label': 'Search results',

  /** Accessibility label for Search Input for when there are recent searches */
  'navbar.search.recent-searches-label': 'Recent searches',

  /** Action label for clearing search filters */
  'navbar.search.action.clear-filters': 'Clear filters',

  /** Accessibility label for filtering by document type */
  'navbar.search.action.filter-by-document-type': 'Filter by document type',

  /** Label for placeholder for Filter (singular) */
  'navbar.search.filter-label_one': 'Filter',

  /** Label for placeholder for Filters (plural) */
  'navbar.search.filter-label_other': 'Filters',

  /** Accessibility label for command list for Document types */
  'navbar.search.document-types-label': 'Document types',

  /** Label for when no documents are found for a filter are found */
  'navbar.search.no-matches-found': `No matches for {{filter}}`,

  /** Accessibility action label for clearing document type filters */
  'navbar.search.action.clear-type-filters': 'Clear checked filters',

  /** Clear action label for clearing document type filters */
  'navbar.search.action.clear-type-label': 'Clear',

  /** Accessibility action label for deleting a search filter */
  'navbar.search.action.delete-filter': 'Delete filter',

  /** Action label for adding a search filter */
  'navbar.search.action.add-filter': 'Add filter',

  /** Accessibility Label for filter search input in the filtering section of search */
  'navbar.search.filter-by-title-label': 'Filter by title',

  /** Label for filter search tooltip based on the field name */
  'navbar.search.filter-field-name': 'Field name',

  /** Label for filter search tooltip based on the field description */
  'navbar.search.filter-field-description': 'Field description',

  /** Message for showing that it's used in specific document types (used within the filter search tooltip) */
  'navbar.search.used-in-document-types': 'Used in document types',

  /** Label for "all fields" in the filter menu */
  'navbar.search.all-fields': 'All fields',

  /** Label for "shared fields" in the filter menu */
  'navbar.search.shared-fields': 'Shared fields',

  /** Label for "unknown types" in the filter menu */
  'navbar.search.unknown-type-label': 'Unknown type',

  /** Label for boolean filter - true */
  'navbar.search.true': 'True',

  /** Label for boolean filter - false */
  'navbar.search.false': 'False',

  /** Label for number and string filter */
  'navbar.search.value': 'Value',

  /** Label for number range filter - min placeholder */
  'navbar.search.min-value': 'Min value',

  /** Label for number range filter - max placeholder */
  'navbar.search.max-value': 'Max value',

  /** Label for search value in a range of numbers */
  'navbar.search.number-items-range': `{{min}} → {{max}} items`,

  /** Title label for when no search results are found */
  'navbar.search.no-results-title': 'No results found',

  /** Description for when no search results are found */
  'navbar.search.no-results-description': 'Try another keyword or adjust your filters',

  /** Title label for when the search has found an error */
  'navbar.search.error.something-went-wrong-title': 'Something went wrong while searching',

  /** Description label for when the search has found an error */
  'navbar.search.error.something-went-wrong-description':
    'Please try again or check your connection',

  /** Label for when the asset source is unknown (used in the nav bar search, specifically filter) */
  'navbar.search.error.unknown-asset-source': 'Unknown asset source found',

  /** Title for error when no valid asset sources found */
  'navbar.search.error.no-valid-asset-source-title': 'No valid asset sources found.',

  /** Description for error when no valid asset source is found, describes that only the default asset is supported */
  'navbar.search.error.no-valid-asset-source-only-default-description':
    'Currently, only the default asset source is supported.',

  /** Description for error when no valid asset source is found, describes that you should cehck the the current studio config */
  'navbar.search.error.no-valid-asset-source-check-config-description': `Please ensure it's enabled in your studio configuration file.`,

  /** Title for error when a filter cannot be displayed */
  'navbar.search.error.display-filter-title': 'An error occurred whilst displaying this filter.',

  /** Description for error when a filter cannot be displayed, describes that you should check the schema */
  'navbar.search.error.display-filter-description':
    'This may indicate invalid options defined in your schema.',

  /** Label for error when the useSearchState is not used within the SearchProvider */
  'navbar.search.error.use-search-state-not-used-within-provider':
    'useSearchState must be used within an SearchProvider',

  /** Label for action to clear recent searches */
  'navbar.search.action.clear-recent-searches': 'Clear recent searches',

  /** Label for action to select an asset type */
  'navbar.search.action.select-type': `Select {{type}}`,

  /** Label for action to select for filters for string lists */
  'navbar.search.action.select': `Select...`,

  /** Label for action to clear filter (used in multiple places within the search) */
  'navbar.search.action.clear': `Clear`,

  /** Label for placeholder when searching specific document types */
  'navbar.search.action.search-for-doc-type': `Search for {{documentTypes}}`,

  /** Label for searching all documents */
  'navbar.search.action.search-all-docs': `Search all documents`,

  /** Label for header (accessibility) when it's full screen and you want to close the search */
  'navbar.search.action.close-search': 'Close search',

  /** Label for header (accessibility) when it's full screen and you want to toggle filters */
  'navbar.search.action.toggle-filters': 'Toggle filters',

  /** Label for instructions on how to use the search when no recent searches are available */
  'navbar.search.instructions': 'Use the following icon to refine your search',

  /** Label for truncating document types: showing all types */
  'navbar.search.all-types-label': 'All types',

  /** Label for truncating document types: showing the remaining count of document types */
  'navbar.search.remaining-document-types': '+{{remainingCount}} more',

  /** --- Configuration Issues --- */

  /** label for when when there are configuration issues */
  'navbar.configuration.error.found-configuration-issues-status': 'Found configuration issues',

  /** Error title for when there are configuration issues */
  'navbar.configuration.error.configuration-issues-title': 'Configuration issues',

  /** Error description for when there are configuration issues, explaining that the checks are only performed during development */
  'navbar.configuration.error.configuration-issues-description':
    'Configuration checks are only performed during development and will not be visible in production builds',

  /** Warning label that tells the user how many warnings were found */
  'navbar.configuration.found-number-schema-warning': `Found {{count}} schema warnings`,

  /** Label for displaying the schema error and warnings for the studio configurations */
  'navbar.configuration.type-label': 'type',

  /** Prompt to view documentation about the schema problems */
  'navbar.configuration.action.view-documentation': 'View documentation',

  /** --- Help & Resources Menu --- */

  /** Title for help and resources menus */
  'navbar.helpResources.title': 'Help and resources',

  /** Information for what studio version the current studio is running */
  'navbar.helpResources.studio-version': `Sanity Studio version {{studioVersion}}`,

  /** Information for what the latest sanity version is */
  'navbar.helpResources.latest-sanity-version': `Latest version is {{latestVersion}}`,

  /** Label for "join our community" call to action */
  'navbar.helpResources.action.join-our-community': `Join our community`,

  /** Label for "help and support" call to action */
  'navbar.helpResources.action.help-and-support': `Help and support`,

  /** Label for "contact sales" call to action */
  'navbar.helpResources.action.contact-sales': `Contact sales`,

  /** --- User Menu --- */

  /** Label for tooltip to show which provider the currently logged in user is using */
  'navbar.user-menu.login-provider': `Signed in with {{providerTitle}}`,

  /** Label for action to manage the current sanity project, used for accessibility as well */
  'navbar.user-menu.action.manage-project': 'Manage project',

  /** Label for action to invite members to the current sanity project, used for accessibility as well */
  'navbar.user-menu.action.invite-members': 'Invite members',

  /** Label for action to sign out of the current sanity project */
  'navbar.user-menu.action.sign-out': 'Sign out',

  /** Title for appearance section for the current studio (dark / light scheme) */
  'navbar.user-menu.appearance-title': 'Appearance',

  /** Title for using system apparence in the apperance user menu */
  'navbar.user-menu.color-scheme.system-title': 'System',

  /** Description for using "system apparence" in the apperance user menu */
  'navbar.user-menu.color-scheme.system-description': 'Use system appearance',

  /** Title for using the "dark theme" in the apperance user menu */
  'navbar.user-menu.color-scheme.dark-title': 'Dark',

  /** Description for using the "dark theme" in the apperance user menu */
  'navbar.user-menu.color-scheme.dark-description': 'Use dark appearance',

  /** Title for using the "light theme" in the apperance user menu */
  'navbar.user-menu.color-scheme.light-title': 'Light',

  /** Description for using the "light theme" in the apperance user menu */
  'navbar.user-menu.color-scheme.light-description': 'Use light appearance',

  /** Title for locale section for the current studio */
  'navbar.user-menu.locale-title': 'Language',

  /** --- Presence Menu --- */

  /** Message title for when no one else is in the presence menu */
  'navbar.presence-menu.no-one-else-title': 'No one else is here',

  /** Message description for when no one else is in the presence menu */
  'navbar.presence-menu.no-one-else-description':
    'Invite people to the project to see their online status.',

  /** Label for action to manage members of the current studio project */
  'nav.presence-menu.action.manage-members': 'Manage members',

  /** Message for when a user is not in a document (within the presence menu) */
  'nav.presence-menu.not-in-a-document': 'Not in a document',
}

/**
 * The i18n resource keys for the studio.
 *
 * @alpha
 * @hidden
 */
export type StudioLocaleResourceKeys = keyof typeof studioLocaleStrings

/**
 * Locale resources for the core studio namespace, eg US English locale resources.
 *
 * @beta
 * @hidden
 */
export const studioDefaultLocaleResources = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: studioLocaleNamespace,
  resources: studioLocaleStrings,
})
