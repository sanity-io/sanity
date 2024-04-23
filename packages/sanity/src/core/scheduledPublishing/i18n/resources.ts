/* eslint sort-keys: "error" */
import {defineLocalesResources} from '../../i18n'
import {scheduledPublishingNamespace} from '.'

/**
 * Defined locale strings for the scheduled publishing tool, in US English.
 *
 * @internal
 */
const scheduledPublishingStrings = defineLocalesResources(scheduledPublishingNamespace, {
  // The text shown in the menu item to change how the scheduled items are sorted, indicating it will be by time added
  'actions.sort.by-added': 'Sort by time added',
  // The text shown in the menu item to change how the scheduled items are sorted, indicating it will be by time scheduled
  'actions.sort.by-scheduled': 'Sort by time scheduled',

  // The badge label shown in the documents that are scheduled to be published.
  'badge.label': 'Scheduled',
  // The name of the action that is executed when publishing the document
  'badge.publish-action': 'Publishing',
  // The badge title shown in the documents that are scheduled to be published.
  'badge.title': '{{action}} on {{time}} (local time)',
  // The name of the action that is executed when un-publishing the document
  'badge.unpublish-action': 'Unpublishing',

  // The text for the confirm button in the schedule edit dialog
  'dialog.scheduled-edit.confirm': 'Update',
  // The text in the explaining how the change will affect the schedule in the time zone dialog.
  'dialog.time-zone.explanation':
    'The selected time zone will change how dates are represented in schedules.',
  // The header text for the time zone dialog
  'dialog.time-zone.header': 'Select time zone',
  // The text used to explain the the timezone selected is the local timezone
  'dialog.time-zone.input.is-local-time': 'local time',
  // The title for the input in the time zone dialog.
  'dialog.time-zone.input.label': 'Time zone',
  // The text in the timezone dialog input placeholder
  'dialog.time-zone.input.placeholder': 'Search for a city or time zone',
  // The text for the action to select local time zone.
  'dialog.time-zone.select-time-action': 'Select local time zone',
  // The text shown when scheduled publishing is not enabled in the current plan on a document that is scheduled to be published.
  'document-banner.not-enabled': ' Scheduled publishing is not available on your current plan',
  // The text to display in the document banner indicating that a schedule is upcoming.
  'document-banner.upcoming': '<Strong>Upcoming schedule</Strong> (local time)',

  // The description shown in the schedule tool when it's empty and in canceled tab
  'empty-schedules.canceled.description':
    'Schedules can fail for several reasons, for example when their documents are deleted. When they do, they show up here.',
  // The title shown in the schedule tool when it's empty and in canceled tab
  'empty-schedules.canceled.title': 'No failed scheduled publications',

  // The description shown in the schedule tool when it's empty and in scheduled tab
  'empty-schedules.scheduled.description':
    'When editing a document, create a new scheduled publication from the menu next to the Publish button.',
  // The title shown in the schedule tool when it's empty and in scheduled tab
  'empty-schedules.scheduled.title': 'No upcoming scheduled publications',

  // The description shown in the schedule tool when it's empty and in succeeded tab
  'empty-schedules.succeeded.description':
    'When a scheduled document is successfully published it moves to this list view.',
  // The title shown in the schedule tool when it's empty and in succeeded tab
  'empty-schedules.succeeded.title': 'No completed scheduled publications ... yet',

  // The description shown in the scheduled publishing dialog when the schedule action fails to fetch
  'schedule-action.fetch-error.description': 'More information in the developer console.',
  // The title shown in the scheduled publishing dialog when the schedule action fails to fetch
  'schedule-action.fetch-error.title': 'Something went wrong, unable to retrieve schedules.',
  // The text shown in the schedule action when a new schedule is going to be created.
  'schedule-action.new-schedule.body-1':
    'Schedule this document to be published at any time in the future.<Break></Break> Any edits in the meantime will be added to the scheduled document.',
  // The text shown in the schedule action when a new schedule is going to be created.
  'schedule-action.new-schedule.body-2':
    'Visit the Schedules page to get an overview of all schedules.',

  // The text shown in the schedule action when there are no schedules
  'schedule-action.schedule.empty': 'No schedules',

  // Indicates a date cannot be in the past in the schedule form
  'schedule-form.past-date-warning': 'Date cannot be in the past.',
  // The schedule form title
  'schedule-form.title': 'Date and time',

  'schedule-preview.errors':
    'This document has validation errors that should be resolved before its publish date.',
  // The text shown in the button when the scheduled publish failed
  'schedule-preview.failed.title': 'This schedule failed to run.',
  // The text shown in the tooltip when the scheduled publish failed
  'schedule-preview.failed.tooltip': 'Schedule failed',

  // The title shown in the menu item in the schedule preview to clear the schedule
  'schedule-preview.menu-item.clear-schedule': 'Clear completed schedule',
  // The title shown in the menu item in the schedule preview to delete the schedule
  'schedule-preview.menu-item.delete-schedule': 'Delete schedule',
  // The title shown in the menu item in the schedule preview to edit the schedule
  'schedule-preview.menu-item.edit-schedule': 'Edit schedule',
  // The title shown in the menu item in the schedule preview to publish the schedule
  'schedule-preview.menu-item.publish-now': 'Publish now',

  // The text shown in the preview items if the date is not found
  'schedule-preview.no-date': 'No date specified',
  // The subtitle shown in the preview when the document type is not found in the schemas.
  'schedule-preview.no-schema.subtitle': 'It may have been deleted',
  // The title shown in the preview when the document type is not found in the schemas.
  'schedule-preview.no-schema.title': 'Document not found',

  // The warning shown when the document has validation warnings.
  'schedule-preview.warnings': 'This document has validation warnings.',

  // The title for the canceled state, shown in the tab navigation
  'state.cancelled.title': 'Failed',
  // The title for the scheduled state, shown in the tab navigation
  'state.scheduled.title': 'Upcoming',
  // The title for the succeeded state, shown in the tab navigation
  'state.succeeded.title': 'Completed',

  // The content of the tooltip shown to indicate which timezone is displayed.
  'time-zone-button.tooltip': `Displaying schedules in {{alternativeName}} (GMT{{offset}})`,

  // The text shown with upsell ui when the plan is not allowed to use schedule publishing
  'upsell-warning.not-available':
    "Your scheduled documents won't be published automatically unless you upgrade your plan. You can still publish them manually.",

  // The text shown in the toast when the action to update the timezone failed.
  'use-time-zone.update.error': 'Unable to update time zone',
  // The text shown in the toast when the action to update the succeeded.
  'use-time-zone.update.success': 'Time zone updated',

  // The content of the tooltip shown to indicate that the document has validation issues.
  'validation-info.tooltip': 'Show validation issues',

  // The button text shown in the schedules list to clear all the completed schedules.
  'virtual-list.clear-all': 'Clear all completed schedules',
})

/**
 * @alpha
 */
export type ScheduledPublishingLocaleResourceKeys = keyof typeof scheduledPublishingStrings

export default scheduledPublishingStrings
