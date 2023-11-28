import {defineLocaleResourceBundle} from '../helpers'
import {studioLocaleNamespace} from '../localeNamespaces'

/**
 * The string resources for the studio core.
 *
 * @internal
 */
export const studioLocaleStrings = {
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

  /** --- Workspace menu --- */

  /** Title for Workplaces dropdown menu */
  'workspaces.title': 'Workspaces',

  /** Label for the workspace menu */
  'workspaces.select-workspace-aria-label': 'Select workspace',

  /** Button label for opening the workspace switcher */
  'workspaces.select-workspace-label': 'Select workspace',

  /** Label for heading that indicates that you can choose your workspace */
  'workspaces.choose-your-workspace-label': 'Choose your workspace',

  /**
   * Label for action to choose a different workspace, in the case where you are not logged in,
   * have selected a workspace, and are faced with the authentication options for the selected
   * workspace. In other words, label for the action shown when you have reconsidered which
   * workspace to authenticate in.
   */
  'workspaces.action.choose-another-workspace': 'Choose another workspace',

  /**
   * Label for action to add a workspace (currently a developer-oriented action, as this will
   * lead to the documentation on workspace configuration)
   */
  'workspaces.action.add-workspace': 'Add workspace',

  /** --- New Document --- */

  /** Placeholder for the "filter" input within the new document menu */
  'new-document.filter-placeholder': 'Filter',

  /** Loading indicator text within the new document menu */
  'new-document.loading': 'Loading…',

  /** Title for "Create new document" dialog */
  'new-document.title': 'Create new document',

  /** Aria label for the button that opens the "Create new document" popover/dialog */
  'new-document.open-dialog-aria-label': 'Create new document',

  /**
   * Tooltip message displayed when hovering/activating the "Create new document" action,
   * when there are no templates/types to create from
   */
  'new-document.no-document-types-label': 'No document types',

  /**
   * Tooltip message displayed when hovering/activating the "Create new document" action,
   * when there are templates/types available for creation
   */
  'new-document.create-new-document-label': 'New document...',

  /** Message for when no results are found for a specific search query in the new document menu */
  'new-document.no-results': 'No results for <0>{{searchQuery}}</0>',

  /** Message for when there are no document type options in the new document menu */
  'new-document.no-document-types-found': 'No document types found',

  /** Accessibility label for the list displaying options in the new document menu */
  'new-document.new-document-aria-label': 'New document',

  /** Error label for when a user is unable to create a document */
  'new-document.error.unable-to-create-document': 'create this document',

  /** --- Search --- */

  /** Placeholder text for the omnisearch input field */
  'search.placeholder': 'Search',

  /** Accessibility label to open search action when the search would go fullscreen (eg on narrower screens) */
  'search.action-open-aria-label': 'Open search',

  /** Accessibility label for the search results section, shown when the user has typed valid terms */
  'search.search-results-aria-label': 'Search results',

  /** Accessibility label for the recent searches section, shown when no valid search terms has been given */
  'search.recent-searches-aria-label': 'Recent searches',

  /** Label/heading shown for the recent searches section */
  'search.recent-searches-label': 'Recent searches',

  /** Action label for clearing search filters */
  'search.action.clear-filters': 'Clear filters',

  /** Accessibility label for filtering by document type */
  'search.action.filter-by-document-type-aria-label': 'Filter by document type',

  /** Accessibility label for the "Filters" list, that is shown when using "Add filter" in search (singular) */
  'search.filters-aria-label_one': 'Filter',

  /** Accessibility label for the "Filters" list, that is shown when using "Add filter" in search (plural) */
  'search.filters-aria-label_other': 'Filters',

  /** Placeholder for the "Filter" input, when narrowing possible fields/filters */
  'search.filter-placeholder': 'Filter',

  /** Label for when no fields/filters are found for the given term */
  'search.filter-no-matches-found': `No matches for {{filter}}`,

  /** Accessibility label for list displaying the available document types */
  'search.document-types-aria-label': 'Document types',

  /** Label for when no document types matching the filter are found */
  'search.document-types-no-matches-found': `No matches for {{filter}}`,

  /** Accessibility label for action to clear all currently applied document type filters */
  'search.action.clear-type-filters-aria-label': 'Clear checked filters',

  /** Label for action to clear all currently applied document type filters */
  'search.action.clear-type-filters-label': 'Clear',

  /** Accessibility action label for removing an already applied search filter */
  'search.action.remove-filter-aria-label': 'Remove filter',

  /** Action label for adding a search filter */
  'search.action.add-filter': 'Add filter',

  /** Accessibility label for list that lets you filter fields by title, when adding a new filter in search */
  'search.filter-by-title-aria-label': 'Filter by title',

  /** Label for "field name" shown in tooltip when navigating list of possible fields to filter */
  'search.filter-field-tooltip-name': 'Field name',

  /** Label for "field description" shown in tooltip when navigating list of possible fields to filter */
  'search.filter-field-tooltip-description': 'Field description',

  /** Label for "Used in document types", a list of the document types a field appears in. Shown in tooltip when navigating list of possible fields to filter */
  'search.filter-field-tooltip-used-in-document-types': 'Used in document types',

  /**
   * Label for "All fields", a label that appears above the list of available fields when filtering.
   * If one or more document type has been chosen as filter, this label is replaced with a group of
   * fields per selected document type
   */
  'search.filter-all-fields-header': 'All fields',

  /**
   * Label for "shared fields", a label that appears above a list of fields that all filtered types
   * have in common, when adding a new filter. For instance, if "book" and "employee" both have a
   * "title" field, this field would be listed under "shared fields".
   * */
  'search.filter-shared-fields-header': 'Shared fields',

  /** Label for boolean filter - true */
  'search.filter.true': 'True',

  /** Label for boolean filter - false */
  'search.filter.false': 'False',

  /** Placeholder value for the string filter */
  'search.filter.string-value-placeholder': 'Value',

  /** Placeholder value for the number filter */
  'search.filter.number-value-placeholder': 'Value',

  /** Placeholder value for minimum numeric value filter */
  'search.filter.number-min-value-placeholder': 'Min value',

  /** Placeholder value for maximum numeric value filter */
  'search.filter.number-max-value-placeholder': 'Max value',

  /** Label/placeholder prompting user to select one of the predefined, allowed values for a string field */
  'search.filter.string-value-select-predefined-value': 'Select...',

  /** Label for the action of clearing the currently selected asset in an image/file filter */
  'search.filter.asset-clear': 'Clear',

  /** Label for the action of clearing the currently selected document in a reference filter */
  'search.filter.reference-clear': 'Clear',

  /** Label for search value in a range of numbers */
  // @todo Part of `arrayOperators` - needs `<Translate />` refactoring
  'search.filter.number-items-range': `{{min}} → {{max}} items`,

  /** Title label for when no search results are found */
  'search.no-results-title': 'No results found',

  /** Helpful description for when no search results are found */
  'search.no-results-help-description': 'Try another keyword or adjust your filters',

  /** Title label for when search returned an error that we are not able to describe in detail */
  'search.error.unspecified-error-title': 'Something went wrong while searching',

  /** Helpful description for when search returned an error that we are not able to describe in detail */
  'search.error.unspecified-error-help-description': 'Please try again or check your connection',

  /** Title for error when no valid asset sources found */
  'search.error.no-valid-asset-source-title': 'No valid asset sources found.',

  /** Description for error when no valid asset source is found, describes that only the default asset is supported */
  'search.error.no-valid-asset-source-only-default-description':
    'Currently, only the default asset source is supported.',

  /** Description for error when no valid asset source is found, describes that you should check the the current studio config */
  'search.error.no-valid-asset-source-check-config-description': `Please ensure it's enabled in your studio configuration file.`,

  /** Title for error when a filter cannot be displayed (mainly a developer-oriented error) */
  'search.error.display-filter-title': 'An error occurred whilst displaying this filter.',

  /** Description for error when a filter cannot be displayed, describes that you should check the schema */
  'search.error.display-filter-description':
    'This may indicate invalid options defined in your schema.',

  /** Label for action to clear recent searches */
  'search.action.clear-recent-searches': 'Clear recent searches',

  /** Dialog title for action to select an asset of unknown type */
  'search.action.select-asset': 'Select asset',

  /** Dialog title for action to select an image asset */
  'search.action.select-asset_image': 'Select image',

  /** Dialog title for action to select a file asset */
  'search.action.select-asset_file': 'Select file',

  /**
   * Text displayed when either no document type(s) have been selected, or we need a fallback,
   * eg "Search for all types".
   */
  'search.action.search-all-types': 'Search all documents',

  /**
   * Text displayed when we are able to determine one or more document types that will be used for
   * searching, and can fit within the space assigned by the design.
   */
  'search.action.search-specific-types': `Search for {{types, list}}`,

  /**
   * Text displayed when we are able to determine one or more document types that will be used for
   * searching, but cannot list them all within the space assigned by the design, so we need an
   * additional "and X more" suffix. Allows using pluralization suffixes, eg `_one`, `_other` etc.
   */
  'search.action.search-specific-types-truncated': `Search for {{types, list}} +{{count}} more`,

  /**
   * In the context of a list of document types - no filtering selection has been done,
   * thus the default is "all types".
   */
  'search.document-type-list-all-types': 'All types',

  /**
   * A list of provided types, formatted with the locales list formatter.
   */
  'search.document-type-list': `{{types, list}}`,

  /**
   * A list of provided types that has been truncated - more types are included but not displayed,
   * thus we need to indicate that there are more. Allows using pluralization suffixes,
   * eg `_one`, `_other` etc.
   */
  'search.document-type-list-truncated': `{{types, list}} +{{count}} more`,

  /** Accessibility label for when the search is full screen (on narrow screens) and you want to close the search */
  'search.action.close-search-aria-label': 'Close search',

  /** Accessibility label for when the search is full screen (on narrow screens) and you want to toggle filters */
  'search.action.toggle-filters-aria-label': 'Toggle filters',

  /** Label for instructions on how to use the search - displayed when no recent searches are available */
  'search.instructions': 'Use <0></0> to refine your search',

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

  /** Label for displaying the schema error and warnings for the studio configurations */
  'navbar.configuration.type-label-1': '<0>{{schemaType}}</0> type <1>{{schemaName}}</1>',

  /** Prompt to view documentation about the schema problems */
  'navbar.configuration.action.view-documentation': 'View documentation',

  /** --- Help & Resources Menu --- */

  /** Title for help and resources menus */
  'navbar.helpResources.title': 'Help and resources',

  /** Information for what studio version the current studio is running */
  'navbar.helpResources.studio-version': `Sanity Studio version {{studioVersion}}`,

  /** Information for what the latest sanity version is */
  'navbar.helpResources.latest-sanity-version': `Latest version is {{latestVersion}}`,

  /** Label for "join our community" call to action.
   * These are titles for fallback links in the event the help + resources endpoint isn't able to be fetched. */
  'navbar.helpResources.action.join-our-community': `Join our community`,

  /** Label for "help and support" call to action.
   * These are titles for fallback links in the event the help + resources endpoint isn't able to be fetched
   */
  'navbar.helpResources.action.help-and-support': `Help and support`,

  /** Label for "contact sales" call to action
   *  These are titles for fallback links in the event the help + resources endpoint isn't able to be fetched
   */
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
  'navbar.presence-menu.action.manage-members': 'Manage members',

  /** Message for when a user is not in a document (within the presence menu) */
  'navbar.presence-menu.not-in-a-document': 'Not in a document',
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
