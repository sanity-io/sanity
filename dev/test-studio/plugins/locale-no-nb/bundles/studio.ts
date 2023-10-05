import type {StudioLocaleResourceKeys} from 'sanity'

const studioResources: Record<StudioLocaleResourceKeys, string> = {
  /** Placeholder text for the omnisearch input field */
  'search.placeholder': 'Søk',

  /* Relative time, just now */
  'timeAgo.justNow': 'akkurat nå',

  /* Relative time, granularity: weeks*/
  'timeAgo.weeks_one': '{{count}} uke',
  'timeAgo.weeks_other': '{{count}} uker',
  /* Relative time, granularity: weeks, configured to show ago suffix*/
  'timeAgo.weeks.ago_one': '{{count}} uke siden',
  'timeAgo.weeks.ago_other': '{{count}} uker siden',
  /* Relative time, granularity: count, using a minimal format*/
  'timeAgo.weeks.minimal': '{{count}}u',
  /* Relative time, granularity: weeks, using a minimal format, configured to show ago suffix*/
  'timeAgo.weeks.minimal.ago': '{{count}}u siden',

  /* Relative time, granularity: days*/
  'timeAgo.days_one': 'i går',
  'timeAgo.days_other': '{{count}} dager',
  /* Relative time, granularity: days, configured to show ago suffix*/
  'timeAgo.days.ago_one': 'i går',
  'timeAgo.days.ago_other': '{{count}} dager siden',
  /* Relative time, granularity: days, using a minimal format*/
  'timeAgo.days.minimal_one': 'i går',
  'timeAgo.days.minimal_other': '{{count}}d',
  /* Relative time, granularity: days, using a minimal format, configured to show ago suffix*/
  'timeAgo.days.minimal.ago': '{{count}}d siden',

  /* Relative time, granularity: hours*/
  'timeAgo.hours_one': 'en time',
  'timeAgo.hours_other': '{{count}} timer',
  /* Relative time, granularity: hours, configured to show ago suffix*/
  'timeAgo.hours.ago_one': 'en time siden',
  'timeAgo.hours.ago_other': '{{count}} timer siden',
  /* Relative time, granularity: hours, using a minimal format*/
  'timeAgo.hours.minimal': '{{count}}t',
  /* Relative time, granularity: hours, using a minimal format, configured to show ago suffix*/
  'timeAgo.hours.minimal.ago': '{{count}}t siden',

  /* Relative time, granularity: minutes*/
  'timeAgo.minutes_one': 'ett minutt',
  'timeAgo.minutes_other': '{{count}} minutter',
  /* Relative time, granularity: minutes, configured to show ago suffix*/
  'timeAgo.minutes.ago_one': 'ett minutt siden',
  'timeAgo.minutes.ago_other': '{{count}} minutter siden',
  /* Relative time, granularity: minutes, using a minimal format*/
  'timeAgo.minutes.minimal': '{{count}}m',
  /* Relative time, granularity: minutes, using a minimal format, configured to show ago suffix*/
  'timeAgo.minutes.minimal.ago': '{{count}}m siden',

  /* Relative time, granularity: seconds*/
  'timeAgo.seconds_one': 'ett sekund',
  'timeAgo.seconds_other': '{{count}} sekunder',
  /* Relative time, granularity: seconds, configured to show ago suffix*/
  'timeAgo.seconds.ago_one': 'ett sekund siden',
  'timeAgo.seconds.ago_other': '{{count}} sekunder siden',
  /* Relative time, granularity: seconds, using a minimal format*/
  'timeAgo.seconds.minimal': '{{count}}s',
  /* Relative time, granularity: seconds, using a minimal format, configured to show ago suffix*/
  'timeAgo.seconds.minimal.ago': '{{count}}s siden',

  /** --- DateTime (and Date) Input --- */

  /** Action message for navigating to previous month */
  'inputs.datetime.calendar.action.previous-month': `Forrige måned`,
  /** Action message for navigating to next year */
  'inputs.datetime.calendar.action.next-year': `Neste år`,
  /** Action message for navigating to previous year */
  'inputs.datetime.calendar.action.previous-year': `Forrige år`,
  /** Action message for selecting hour */
  'inputs.datetime.calendar.action.select-hour': `Velg time`,
  /** Action message for setting to current time */
  'inputs.datetime.calendar.action.set-to-current-time': `Sett til nå`,

  /** Month names */
  'inputs.datetime.calendar.month-names.january': 'Januar',
  'inputs.datetime.calendar.month-names.february': 'Februar',
  'inputs.datetime.calendar.month-names.march': 'Mars',
  'inputs.datetime.calendar.month-names.april': 'April',
  'inputs.datetime.calendar.month-names.may': 'Mai',
  'inputs.datetime.calendar.month-names.june': 'Juni',
  'inputs.datetime.calendar.month-names.july': 'Juli',
  'inputs.datetime.calendar.month-names.august': 'August',
  'inputs.datetime.calendar.month-names.september': 'September',
  'inputs.datetime.calendar.month-names.october': 'Oktober',
  'inputs.datetime.calendar.month-names.november': 'November',
  'inputs.datetime.calendar.month-names.december': 'Desember',

  /** Short weekday names */
  'inputs.datetime.calendar.weekday-names.short.monday': 'Man',
  'inputs.datetime.calendar.weekday-names.short.tuesday': 'Tir',
  'inputs.datetime.calendar.weekday-names.short.wednesday': 'Ons',
  'inputs.datetime.calendar.weekday-names.short.thursday': 'Tor',
  'inputs.datetime.calendar.weekday-names.short.friday': 'Fre',
  'inputs.datetime.calendar.weekday-names.short.saturday': 'Lør',
  'inputs.datetime.calendar.weekday-names.short.sunday': 'Søn',

  /** Label for selecting a hour preset. Receives a `time` param as a string on hh:mm format and a `date` param as a Date instance denoting the preset date */
  'inputs.datetime.calendar.action.set-to-time-preset': '{{time}} on {{date, datetime}}',

  /** --- Reference (and Cross-Dataset Reference) Input --- */

  /** Error title for when the search for a reference failed. Note that the message sent by the backend may not be localized. */
  'inputs.reference.error.search-failed-title': `Referansesøk mislyktes`,

  /** Error title for when the current reference value points to a document that does not exist (on weak references) */
  'inputs.reference.error.nonexistent-document-title': 'Ikke funnet',

  /** Error description for when the current reference value points to a document that does not exist (on weak references) */
  'inputs.reference.error.nonexistent-document-description': `Det refererte dokumentet eksisterer ikke (ID: <Code>{{documentId}}</Code>). Du kan enten fjerne referansen eller erstatte den med et annet dokument.`,

  /** Error title for when the referenced document failed to be loaded */
  'inputs.reference.error.failed-to-load-document-title': 'Kunne ikke laste referert dokument',

  /** Error title for when the user does not have permissions to read the referenced document */
  'inputs.reference.error.missing-read-permissions-title': 'Manglende tillatelser',

  /** Error description for when the user does not have permissions to read the referenced document */
  'inputs.reference.error.missing-read-permissions-description':
    'Det refererte dokumentet kunne ikke åpnes på grunn av manglende tillatelser',

  /** Error title for when the document is unavailable (for any possible reason) */
  'inputs.reference.error.document-unavailable-title': 'Dokument ikke tilgjengelig',

  /** Error title for when the reference search returned a document that is not an allowed type for the field */
  'inputs.reference.error.invalid-search-result-type-title': `Søket returnerte en type som ikke er gyldig for denne referansen: "{{returnedType}}"`,

  /** Error title for when the document referenced is not one of the types declared as allowed target types in schema */
  'inputs.reference.error.invalid-type-title': 'Dokument av ugyldig type',

  /** Error description for when the document referenced is not one of the types declared as allowed target types in schema */
  'inputs.reference.error.invalid-type-description': `Referert dokument (<Code>{{documentId}}</Code>) er av type <Code>{{actualType}}</Code>. Ifølge skjemaet kan refererte dokumenter bare være av type <AllowedTypes />.`,

  /** Placeholder shown in a reference input with no current value */
  'inputs.reference.search-placeholder': 'Skriv for å søke',

  /** Message shown when no documents were found that matched the given search string */
  'inputs.reference.no-results-for-query':
    'Ingen resultater for <SearchTerm>«{{searchTerm}}»</SearchTerm>',

  /** Label for action to create a new document from the reference input */
  'inputs.reference.action.create-new-document': 'Opprett ny',

  /** Label for action to create a new document from the reference input, when there are multiple templates or document types to choose from */
  'inputs.reference.action-create-new-document-select': 'Opprett ny…',

  /** Label for action to clear the current value of the reference field */
  'inputs.reference.action.clear': 'Tøm',

  /** Label for action to replace the current value of the field */
  'inputs.reference.action.replace': 'Erstatt',

  /** Label for action to remove the reference from an array */
  'inputs.reference.action.remove': 'Fjern',

  /** Label for action to duplicate the current item to a new item (used within arrays) */
  'inputs.reference.action.duplicate': 'Dupliser',

  /** Label for action to cancel a previously initiated replace action  */
  'inputs.reference.action.replace-cancel': 'Avbryt erstatning',

  /** Label for action that opens the referenced document in a new tab */
  'inputs.reference.action.open-in-new-tab': 'Åpne i ny fane',

  /** Text for tooltip showing when a document was published, using relative time (eg "how long ago was it published?") */
  'inputs.reference.preview.published-at-time': 'Publisert <TimeAgo/>',

  /** Text for tooltip indicating that a document has not yet been published */
  'inputs.reference.preview.not-published': 'Ikke publisert',

  /** Accessibility label for icon indicating that document has a published version */
  'inputs.reference.preview.is-published-aria-label': 'Publisert',

  /** Accessibility label for icon indicating that document does _not_ have a published version */
  'inputs.reference.preview.is-not-published-aria-label': 'Ikke publisert',

  /** Text for tooltip showing when a document was edited, using relative time (eg "how long ago was it edited?") */
  'inputs.reference.preview.edited-at-time': 'Redigert <TimeAgo/>',

  /** Text for tooltip indicating that a document has no unpublished edits */
  'inputs.reference.preview.no-unpublished-edits': 'Ingen upubliserte endringer',

  /** Accessibility label for icon indicating that document has unpublished changes */
  'inputs.reference.preview.has-unpublished-changes-aria-label': 'Redigert',

  /** Accessibility label for icon indicating that document does _not_ have any unpublished changes */
  'inputs.reference.preview.has-no-unpublished-changes-aria-label': 'Ingen upubliserte endringer',

  /** --- Array Input --- */

  /** Label for when the array input doesn't have any items */
  'inputs.array.no-items-label': 'Ingen elementer',

  /** Label for when the array input is resolving the initial value for the item */
  'inputs.array.resolving-initial-value': 'Finner startverdi…',

  /** Label for read only array fields */
  'inputs.array.read-only-label': 'Dette feltet er skrivebeskyttet',

  /** Label for removing an array item action  */
  'inputs.array.action.remove': 'Fjern',

  /** Label for removing action when an array item has an error */
  'inputs.array.action.remove-invalid-item': 'Fjern',

  /** Label for duplicating an array item */
  'inputs.array.action.duplicate': 'Dupliser',

  /** Label for viewing the item of a specific type, eg "View Person" */
  'inputs.array.action.view': 'Se {{itemTypeTitle}}',

  /** Label for editing the item of a specific type, eg "Edit Person" */
  'inputs.array.action.edit': 'Rediger {{itemTypeTitle}}',

  /** Label for adding array item action when the schema allows for only one schema type */
  'inputs.array.action.add-item': 'Legg til',

  /**
   * Label for adding one array item action when the schema allows for multiple schema types,
   * eg. will prompt the user to select a type once triggered
   */
  'inputs.array.action.add-item-select-type': 'Legg til...',

  /** Label for adding item before a specific array item */
  'inputs.array.action.add-before': 'Legg til før',

  /** Label for adding item after a specific array item */
  'inputs.array.action.add-after': 'Legg til etter',

  /** Error label for unexpected errors in the Array Input */
  'inputs.array.error.unexpected-error': `Uventet feil: {{error}}`,

  /** Error title for when an item type within an array input is incompatible, used in the tooltip */
  'inputs.array.error.type-is-incompatible-title': 'Hvorfor skjer dette?',

  /** Error description for the array item tooltip that explains what the error means with more context */
  'inputs.array.error.type-is-incompatible-prompt': `Typen <Code>{{typeName}}</Code> er ikke gyldig for denne listen`,

  /** Error description for the array item tooltip that explains that the current type item is not valid for the list  */
  'inputs.array.error.current-schema-not-declare-description':
    'Den nåværende skjemaet erklærer ikke typen <Code>{{typeName}}</Code> som gyldig for denne listen. Dette kan bety at typen har blitt fjernet som en gyldig type, eller at noen andre har lagt den til i sitt eget lokale skjema som ennå ikke er distribuert.',

  /** Error description for the array item tooltip that explains that the current item can still be moved or deleted but not edited since the schema definition is not found */
  'inputs.array.error.can-delete-but-no-edit-description':
    'Du kan fortsatt flytte eller slette dette elementet, men det kan ikke redigeres siden skjemadefinisjonen for typen ikke finnes.',

  /** Error description to show how the item is being represented in the json format */
  'inputs.array.error.json-representation-description': 'JSON-representasjon av dette elementet:',

  /** Error label for toast when trying to upload one array item of a type that cannot be converted to array */
  'inputs.array.error.cannot-upload-unable-to-convert_one':
    'Følgende element kan ikke lastes opp fordi det ikke finnes noen kjent konvertering fra innholdstypen til element i listen:',

  /** Error label for toast when trying to upload multiple array items of a type that cannot be converted to array */
  'inputs.array.error.cannot-upload-unable-to-convert_other':
    'Følgende elementer kan ikke lastes opp fordi det ikke finnes noen kjent konvertering fra innholdstypene til element i listen:',

  /** Error label for toast when array could not resolve the initial value */
  'inputs.array.error.cannot-resolve-initial-value-title':
    'Kan ikke finne startverdi for type: {{schemaTypeTitle}}: {{errorMessage}}.',
}

export default studioResources
