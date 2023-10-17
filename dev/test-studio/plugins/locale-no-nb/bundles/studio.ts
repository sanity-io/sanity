import type {StudioLocaleResourceKeys} from 'sanity'

const studioResources: Record<StudioLocaleResourceKeys, string> = {
  /* Relative time, just now */
  'relative-time.just-now': 'akkurat nå',

  /** --- Review Changes --- */

  /** Title for the Review Changes pane */
  'changes.title': 'Se endringer',

  /** Label for the close button label in Review Changes pane */
  'changes.action.close-label': 'Lukk gjennomgang av endringer',

  /** Label and text for tooltip that indicates the authors of the changes */
  'changes.changes-by-author': 'Endringer av',

  /** Loading changes in Review Changes Pane */
  'changes.loading-changes': 'Laster endringer',

  /** No Changes title in the Review Changes pane */
  'changes.no-changes-title': 'Det er ingen endringer',

  /** No Changes description in the Review Changes pane */
  'changes.no-changes-description':
    'Rediger dokumentet eller velg en eldre versjon i tidslinjen for å se en liste over endringer i dette panelet.',

  /** Prompt for reverting all changes in document in Review Changes pane. Includes a count of changes. */
  'changes.action.revert-all-description': `Er du sikker på at du vil angre alle {{count}} endringer?`,

  /** Cancel label for revert button prompt action */
  'changes.action.revert-all-cancel': `Avbryt`,

  /** Revert all confirm label for revert button action - used on prompt button + review changes pane */
  'changes.action.revert-all-confirm': `Angre alle`,

  /** Loading author of change in the differences tooltip in the review changes pane */
  'changes.loading-author': 'Laster…',

  /** --- Review Changes: Field + Group --- */

  /** Prompt for reverting changes for a field change */
  'changes.action.revert-changes-description': `Er du sikker på at du vil angre endringene?`,

  /** Prompt for reverting changes for a group change, eg multiple changes */
  'changes.action.revert-changes-description_one': `Er du sikker på at du vil angre endringen?`,

  /** Prompt for confirming revert change (singular) label for field change action */
  'changes.action.revert-changes-confirm-change_one': `Angre endring`,

  /** Revert for confirming revert (plural) label for field change action */
  'changes.action.revert-changes-confirm-change_other': `Angre endringer`,

  /** --- Document timeline, for navigating different revisions of a document --- */

  /** Error prompt when revision cannot be loaded */
  'timeline.error.unable-to-load-revision': 'Kan ikke laste revisjon',

  /** Label for latest version for timeline menu dropdown */
  'timeline.latest-version': 'Siste versjon',

  /** Label for loading history */
  'timeline.loading-history': 'Laster historikk',

  /**
   * Label for determining since which version the changes for timeline menu dropdown are showing.
   * Receives the time label as a parameter.
   */
  'timeline.since': 'Siden: {{timestamp, datetime}}',

  /** Label for missing change version for timeline menu dropdown are showing */
  'timeline.since-version-missing': 'Siden: ukjent versjon',

  /** Title for error when the timeline for the given document can't be loaded */
  'timeline.error.load-document-changes-title':
    'En feil oppstod under henting av dokumentendringer.',

  /** Description for error when the timeline for the given document can't be loaded */
  'timeline.error.load-document-changes-description': 'Historikk har ikke blitt påvirket.',

  /** Error title for when the document doesn't have history */
  'timeline.error.no-document-history-title': 'Ingen historikk',

  /** Error description for when the document doesn't have history */
  'timeline.error.no-document-history-description':
    'Når du endrer innholdet i dokumentet, vil dokumentversjonene vises i denne menyen.',

  /** --- Timeline constants --- */

  /** Label for when the timeline item is the latest in the history */
  'timeline.latest': 'Siste',

  /** Consts used in the timeline item component (dropdown menu) - helpers */
  'timeline.create': 'Opprettet',
  'timeline.delete': 'Slettet',
  'timeline.discardDraft': 'Utkast forkastet',
  'timeline.initial': 'Opprettet',
  'timeline.editDraft': 'Redigert',
  'timeline.editLive': 'Live redigert',
  'timeline.publish': 'Publisert',
  'timeline.unpublish': 'Avpublisert',

  /** --- Slug Input --- */

  /** Error message for when the source to generate a slug from is missing */
  'inputs.slug.error.missing-source':
    'Kilde mangler. Sjekk `source` på skjematypen «{{schemaType}}»',

  /** Loading message for when the input is actively generating a slug */
  'inputs.slug.action.generating': `Genererer…`,

  /** Action message for generating the slug */
  'inputs.slug.action.generate': `Generer`,

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

  /** --- File (Image, File and ImageTool) Inputs --- */

  /** Accessibility label for button to open image edit dialog */
  'inputs.files.image.actions-menu.edit-details.aria-label': 'Åpne bilderedigeringsdialog',

  /** Open image options menu */
  'inputs.files.image.actions-menu.options.label': 'Åpne bildeinnstillingsmeny',

  /** Tooltip text for action to crop image */
  'inputs.files.image.actions-menu.crop-image-tooltip': 'Beskjær bilde',

  /** The upload could not be completed at this time. */
  'inputs.files.image.upload-error.description':
    'Opplastingen kunne ikke fullføres på dette tidspunktet.',

  /** Upload failed */
  'inputs.files.image.upload-error.title': 'Opplasting mislyktes',

  /** Edit hotspot and crop */
  'inputs.files.image.hotspot-dialog.title': 'Rediger fokuspunkt og beskjær',

  /** Preview of uploaded image */
  'inputs.files.image.preview-uploaded-image': 'Forhåndsvisning av opplastet bilde',

  /** Cannot upload this file here */
  'inputs.files.image.drag-overlay.cannot-upload-here': 'Kan ikke laste opp denne filen her',

  /** This field is read only */
  'inputs.files.image.drag-overlay.this-field-is-read-only': 'Dette feltet er skrivebeskyttet',

  /** Drop image to upload */
  'inputs.files.image.drag-overlay.drop-to-upload-image': 'Slipp bilde for å laste opp',

  /** Invalid image value */
  'inputs.files.image.invalid-image-warning.title': 'Ugyldig bildeverdi',

  /** The value of this field is not a valid image. Resetting this field will let you choose a new image. */
  'inputs.files.image.invalid-image-warning.description':
    'Verdien i dette feltet er ikke et gyldig bilde. Ved å tilbakestille dette feltet kan du velge et nytt bilde.',

  /** The URL is copied to the clipboard */
  'inputs.files.common.actions-menu.notification.url-copied':
    'URL-en er kopiert til utklippstavlen',

  /** Replace */
  'inputs.files.common.actions-menu.replace.label': 'Erstatt',

  /** Upload */
  'inputs.files.common.actions-menu.upload.label': 'Last opp',

  /** Download */
  'inputs.files.common.actions-menu.download.label': 'Last ned',

  /** Copy URL */
  'inputs.files.common.actions-menu.copy-url.label': 'Kopier URL',

  /** Clear field */
  'inputs.files.common.actions-menu.clear-field.label': 'Tøm felt',

  /** Can't upload files here */
  'inputs.files.common.placeholder.upload-not-supported': 'Kan ikke laste opp filer her',

  /** Read only */
  'inputs.files.common.placeholder.read-only': 'Skrivebeskyttet',

  /** Drop to upload file */
  'inputs.files.common.placeholder.drop-to-upload_file': 'Slipp for å laste opp fil',

  /** Drop to upload image */
  'inputs.files.common.placeholder.drop-to-upload_image': 'Slipp for å laste opp bilde',

  /** Cannot upload `{{count}}` files */
  'inputs.files.common.placeholder.cannot-upload-some-files_one': 'Kan ikke laste opp fil',
  'inputs.files.common.placeholder.cannot-upload-some-files_other':
    'Kan ikke laste opp {{count}} filer',

  /** Drag or paste file here */
  'inputs.files.common.placeholder.drag-or-paste-to-upload_file': 'Dra eller lim inn fil her',
  /** Drag or paste image here */
  'inputs.files.common.placeholder.drag-or-paste-to-upload_image': 'Dra eller lim inn bilde her',

  /** Drop to upload */
  'inputs.files.common.drop-message.drop-to-upload': 'Slipp for å laste opp',

  /** Drop to upload `{{count}}` file */
  'inputs.files.common.drop-message.drop-to-upload-multi_one':
    'Slipp for å laste opp {{count}} fil',

  /** Drop to upload `{{count}}` files */
  'inputs.files.common.drop-message.drop-to-upload-multi_other':
    'Slipp for å laste opp {{count}} filer',

  /** Uploading <FileName/> */
  'input.files.common.upload-progress': 'Laster opp <FileName/>',

  /** Incomplete upload */
  'inputs.files.common.stale-upload-warning.title': 'Ufullstendig opplasting',

  /** An upload has made no progress for at least `{{staleThresholdMinutes}}` minutes and likely got interrupted. You can safely clear the incomplete upload and try uploading again. */
  'inputs.files.common.stale-upload-warning.description':
    'En opplasting har ikke gjort fremskritt på minst {{staleThresholdMinutes}} minutter og ble sannsynligvis avbrutt. Du kan trygt fjerne den ufullstendige opplastingen og prøve å laste opp på nytt.',

  /** Clear upload */
  'inputs.files.common.stale-upload-warning.clear': 'Fjern opplasting',

  /** Hotspot & Crop */
  'inputs.files.imagetool.field.title': 'Fokuspunkt & beskjæring',

  /** Adjust the rectangle to crop image. Adjust the circle to specify the area that should always be visible. */
  'inputs.files.imagetool.field.description':
    'Juster rektangelet for å beskjære bildet. Juster sirkelen for å spesifisere området som alltid skal være synlig.',

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
  'inputs.reference.preview.published-at-time': 'Publisert <RelativeTime/>',

  /** Text for tooltip indicating that a document has not yet been published */
  'inputs.reference.preview.not-published': 'Ikke publisert',

  /** Accessibility label for icon indicating that document has a published version */
  'inputs.reference.preview.is-published-aria-label': 'Publisert',

  /** Accessibility label for icon indicating that document does _not_ have a published version */
  'inputs.reference.preview.is-not-published-aria-label': 'Ikke publisert',

  /** Text for tooltip showing when a document was edited, using relative time (eg "how long ago was it edited?") */
  'inputs.reference.preview.edited-at-time': 'Redigert <RelativeTime/>',

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

  /** --- Workspace menu --- */

  /** Title for Workplaces dropdown menu */
  'workspaces.title': 'Arbeidsområder',

  /** Label for the workspace menu */
  'workspaces.select-workspace-aria-label': 'Velg arbeidsområde',

  /** Button label for opening the workspace switcher */
  'workspaces.select-workspace-label': 'Velg arbeidsområde',

  /** Label for heading that indicates that you can choose your workspace */
  'workspaces.choose-your-workspace-label': 'Velg ditt arbeidsområde',

  /**
   * Label for action to choose a different workspace, in the case where you are not logged in,
   * have selected a workspace, and are faced with the authentication options for the selected
   * workspace. In other words, label for the action shown when you have reconsidered which
   * workspace to authenticate in.
   */
  'workspaces.action.choose-another-workspace': 'Velg et annet arbeidsområde',

  /**
   * Label for action to add a workspace (currently a developer-oriented action, as this will
   * lead to the documentation on workspace configuration)
   */
  'workspaces.action.add-workspace': 'Legg til arbeidsområde',

  /** --- New Document --- */

  /** Placeholder for the "filter" input within the new document menu */
  'new-document.filter-placeholder': 'Filtrér',

  /** Loading indicator text within the new document menu */
  'new-document.loading': 'Laster…',

  /** Title for "Create new document" dialog */
  'new-document.title': 'Opprett nytt dokument',

  /** Aria label for the button that opens the "Create new document" popover/dialog */
  'new-document.open-dialog-aria-label': 'Opprett nytt dokument',

  /**
   * Tooltip message displayed when hovering/activating the "Create new document" action,
   * when there are no templates/types to create from
   */
  'new-document.no-document-types-label': 'Ingen dokumenttyper',

  /**
   * Tooltip message displayed when hovering/activating the "Create new document" action,
   * when there are templates/types available for creation
   */
  'new-document.create-new-document-label': 'Nytt dokument…',

  /** Message for when no results are found for a specific search query in the new document menu */
  'new-document.no-results': 'Ingen resultater for <QueryString>«{{searchQuery}}»</QueryString>',

  /** Message for when there are no document type options in the new document menu */
  'new-document.no-document-types-found': 'Ingen dokumenttyper funnet',

  /** Accessibility label for the list displaying options in the new document menu */
  'new-document.new-document-aria-label': 'Nytt dokument',

  /** Error label for when a user is unable to create a document */
  'new-document.error.unable-to-create-document': 'opprette dette dokumentet',

  /** --- Search --- */

  /** Placeholder text for the omnisearch input field */
  'search.placeholder': 'Søk',

  /** Accessibility label to open search action when the search would go fullscreen (eg on narrower screens) */
  'search.action-open-aria-label': 'Åpne søk',

  /** Accessibility label for the search results section, shown when the user has typed valid terms */
  'search.search-results-aria-label': 'Søkeresultater',

  /** Accessibility label for the recent searches section, shown when no valid search terms has been given */
  'search.recent-searches-aria-label': 'Nylige søk',

  /** Label/heading shown for the recent searches section */
  'search.recent-searches-label': 'Nylige søk',

  /** Action label for clearing search filters */
  'search.action.clear-filters': 'Fjern filtre',

  /** Accessibility label for filtering by document type */
  'search.action.filter-by-document-type-aria-label': 'Filtrer etter dokumenttype',

  /** Accessibility label for the "Filters" list, that is shown when using "Add filter" in search (singular) */
  'search.filters-aria-label_one': 'Filter',

  /** Accessibility label for the "Filters" list, that is shown when using "Add filter" in search (plural) */
  'search.filters-aria-label_other': 'Filtre',

  /** Placeholder for the "Filter" input, when narrowing possible fields/filters */
  'search.filter-placeholder': 'Filtrer',

  /** Label for when no fields/filters are found for the given term */
  'search.filter-no-matches-found': `Ingen treff for «{{filter}}»`,

  /** Accessibility label for list displaying the available document types */
  'search.document-types-aria-label': 'Dokumenttyper',

  /** Label for when no document types matching the filter are found */
  'search.document-types-no-matches-found': 'Ingen dokumenttyper funnet',

  /** Accessibility label for action to clear all currently applied document type filters */
  'search.action.clear-type-filters-aria-label': 'Fjern valgte filtre',

  /** Label for action to clear all currently applied document type filters */
  'search.action.clear-type-filters-label': 'Fjern',

  /** Accessibility action label for removing an already applied search filter */
  'search.action.remove-filter-aria-label': 'Fjern filter',

  /** Action label for adding a search filter */
  'search.action.add-filter': 'Legg til filter',

  /** Accessibility label for list that lets you filter fields by title, when adding a new filter in search */
  'search.filter-by-title-aria-label': 'Filtrer etter tittel',

  /** Label for "field name" shown in tooltip when navigating list of possible fields to filter */
  'search.filter-field-tooltip-name': 'Feltnavn',

  /** Label for "field description" shown in tooltip when navigating list of possible fields to filter */
  'search.filter-field-tooltip-description': 'Feltopplysninger',

  /** Label for "Used in document types", a list of the document types a field appears in. Shown in tooltip when navigating list of possible fields to filter */
  'search.filter-field-tooltip-used-in-document-types': 'Brukt i dokumenttyper',

  /** Label for "All fields", a label that appears above the list of available fields when filtering. */
  'search.filter-all-fields-header': 'Alle felter',

  /** Label for "shared fields", a label that appears above a list of fields that all filtered types have in common, when adding a new filter. */
  'search.filter-shared-fields-header': 'Delte felter',

  /** Label for boolean filter - true */
  'search.filter-boolean-true': 'Sant',

  /** Label for boolean filter - false */
  'search.filter-boolean-false': 'Usant',

  /** Placeholder value for the string filter */
  'search.filter-string-value-placeholder': 'Verdi',

  /** Placeholder value for the number filter */
  'search.filter-number-value-placeholder': 'Verdi',

  /** Placeholder value for minimum numeric value filter */
  'search.filter-number-min-value-placeholder': 'Min verdi',

  /** Placeholder value for maximum numeric value filter */
  'search.filter-number-max-value-placeholder': 'Maks verdi',

  /** Label/placeholder prompting user to select one of the predefined, allowed values for a string field */
  'search.filter-string-value-select-predefined-value': 'Velg…',

  /** Label for the action of clearing the currently selected asset in an image/file filter */
  'search.filter-asset-clear': 'Fjern',

  /** Label for the action of clearing the currently selected document in a reference filter */
  'search.filter-reference-clear': 'Fjern',

  /** Label for search value in a range of numbers */
  // @todo Part of `arrayOperators` - needs `<Translate />` refactoring
  'search.filter-number-items-range': `{{min}} → {{max}} elementer`,

  /** Title label for when no search results are found */
  'search.no-results-title': 'Ingen resultater funnet',

  /** Helpful description for when no search results are found */
  'search.no-results-help-description': 'Prøv et annet nøkkelord eller juster filtrene dine',

  /** Title label for when search returned an error that we are not able to describe in detail */
  'search.error.unspecified-error-title': 'Noe gikk galt under søket',

  /** Helpful description for when search returned an error that we are not able to describe in detail */
  'search.error.unspecified-error-help-description':
    'Vennligst prøv igjen eller sjekk tilkoblingen din',

  /** Title for error when no valid asset sources found */
  'search.error.no-valid-asset-source-title': 'Ingen gyldige kilder funnet.',

  /** Description for error when no valid asset source is found, describes that only the default asset is supported */
  'search.error.no-valid-asset-source-only-default-description':
    'For øyeblikket støttes bare standardkilden for bilder/filer.',

  /** Description for error when no valid asset source is found, describes that you should check the the current studio config */
  'search.error.no-valid-asset-source-check-config-description': `Vennligst forsikre deg om at den er aktivert i studioets konfigurasjonsfil.`,

  /** Title for error when a filter cannot be displayed (mainly a developer-oriented error) */
  'search.error.display-filter-title': 'En feil oppstod under visning av dette filteret.',

  /** Description for error when a filter cannot be displayed, describes that you should check the schema */
  'search.error.display-filter-description':
    'Dette kan indikere ugyldige alternativer definert i skjemaet ditt.',

  /** Label for action to clear recent searches */
  'search.action.clear-recent-searches': 'Fjern nylige søk',

  /** Dialog title for action to select an asset of unknown type */
  'search.action.select-asset': 'Velg element',

  /** Dialog title for action to select an image asset */
  'search.action.select-asset_image': 'Velg bilde',

  /** Dialog title for action to select a file asset */
  'search.action.select-asset_file': 'Velg fil',

  /** Text displayed when either no document type(s) have been selected, or we need a fallback, */
  'search.action.search-all-types': 'Søk i alle dokumenter',

  /** Text displayed when we are able to determine one or more document types that will be used for searching */
  'search.action.search-specific-types': `Søk etter {{types, list}}`,

  /** Text displayed when we are able to determine one or more document types that will be used for searching, but cannot list them all within the space assigned by the design */
  'search.action.search-specific-types-truncated': `Søk etter {{types, list}} +{{count}} flere`,

  /** In the context of a list of document types - no filtering selection has been done, thus the default is "all types". */
  'search.document-type-list-all-types': 'Alle typer',

  /** A list of provided types, formatted with the locales list formatter. */
  'search.document-type-list': `{{types, list}}`,

  /** A list of provided types that has been truncated - more types are included but not displayed, thus we need to indicate that there are more. */
  'search.document-type-list-truncated': `{{types, list}} +{{count}} flere`,

  /** Accessibility label for when the search is full screen (on narrow screens) and you want to close the search */
  'search.action.close-search-aria-label': 'Lukk søk',

  /** Accessibility label for when the search is full screen (on narrow screens) and you want to toggle filters */
  'search.action.toggle-filters-aria-label_hide': 'Skjul filtre',
  'search.action.toggle-filters-aria-label_show': 'Vis filtre',

  /** Label for instructions on how to use the search - displayed when no recent searches are available */
  'search.instructions': 'Bruk <ControlsIcon/> for å rafinere søket.',

  /** --- Help & Resources Menu --- */

  /** Title for help and resources menus */
  'help-resources.title': 'Hjelp og ressurser',

  /** Information for what studio version the current studio is running */
  'help-resources.studio-version': `Sanity Studio versjon {{studioVersion}}`,

  /** Information for what the latest sanity version is */
  'help-resources.latest-sanity-version': `Siste versjon er {{latestVersion}}`,

  /**
   * Label for "join our community" call to action
   * These are titles for fallback links in the event the help & resources endpoint isn't able to be fetched
   */
  'help-resources.action.join-our-community': `Bli med i vårt community`,

  /**
   * Label for "help and support" call to action
   * These are titles for fallback links in the event the help & resources endpoint isn't able to be fetched
   */
  'help-resources.action.help-and-support': `Hjelp og støtte`,

  /**
   * Label for "contact sales" call to action
   * These are titles for fallback links in the event the help & resources endpoint isn't able to be fetched
   */
  'help-resources.action.contact-sales': `Kontakt salg`,

  /** --- User Menu --- */

  /** Label for tooltip to show which provider the currently logged in user is using */
  'user-menu.login-provider': `Logget inn med {{providerTitle}}`,

  /** Label for action to manage the current sanity project */
  'user-menu.action.manage-project': 'Administrer prosjekt',

  /** Accessibility label for the action to manage the current project */
  'user-menu.action.manage-project-aria-label': 'Administrer prosjekt',

  /** Label for action to invite members to the current sanity project */
  'user-menu.action.invite-members': 'Inviter medlemmer',

  /** Accessibility label for action to invite members to the current sanity project */
  'user-menu.action.invite-members-aria-label': 'Inviter medlemmer',

  /** Label for action to sign out of the current sanity project */
  'user-menu.action.sign-out': 'Logg ut',

  /** Title for appearance section for the current studio (dark / light / system scheme) */
  'user-menu.appearance-title': 'Utseende',

  /** Title for using system apparence in the appearance user menu */
  'user-menu.color-scheme.system-title': 'System',

  /** Description for using "system apparence" in the appearance user menu */
  'user-menu.color-scheme.system-description': 'Bruk systemutseende',

  /** Title for using the "dark theme" in the appearance user menu */
  'user-menu.color-scheme.dark-title': 'Mørk',

  /** Description for using the "dark theme" in the appearance user menu */
  'user-menu.color-scheme.dark-description': 'Bruk mørkt utseende',

  /** Title for using the "light theme" in the appearance user menu */
  'user-menu.color-scheme.light-title': 'Lys',

  /** Description for using the "light theme" in the appearance user menu */
  'user-menu.color-scheme.light-description': 'Bruk lyst utseende',

  /** Title for locale section for the current studio */
  'user-menu.locale-title': 'Språk',

  /** --- Presence --- */

  /** Message title for when no one else is currently present */
  'presence.no-one-else-title': 'Ingen andre er her',

  /** Message description for when no one else is currently present */
  'presence.no-one-else-description': 'Inviter folk til prosjektet for å se deres onlinestatus.',

  /** Label for action to manage members of the current studio project */
  'presence.action.manage-members': 'Administrer medlemmer',

  /** Message for when a user is not in a document (displayed in the global presence menu) */
  'presence.not-in-a-document': 'Ikke i et dokument',
}

export default studioResources
