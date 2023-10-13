import type {StudioLocaleResourceKeys} from 'sanity'

const studioResources: Record<StudioLocaleResourceKeys, string> = {
  /** Placeholder text for the omnisearch input field */
  'search.placeholder': 'Søk',

  /* Relative time, just now */
  'relative-time.just-now': 'akkurat nå',

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
}

export default studioResources
