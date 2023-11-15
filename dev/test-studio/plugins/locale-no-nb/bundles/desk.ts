import type {DeskLocaleResourceKeys} from 'sanity/desk'

/**
 * Defined locale strings for the desk tool, in Norwegian (Bokmål).
 *
 * @internal
 */
const deskLocaleStrings: Record<DeskLocaleResourceKeys, string> = {
  /** --- PUBLISH ACTION --- */
  /** Tooltip when action is disabled because the studio is not ready.*/
  'action.publish.disabled.not-ready': 'Operasjonen er ikke klar',

  /** Label for action when there are pending changes.*/
  'action.publish.draft.label': 'Publiser',

  /** Label for the "Publish" document action while publish is being executed.*/
  'action.publish.running.label': 'Publiserer…',

  /** Label for the "Publish" document action when there are no changes.*/
  'action.publish.published.label': 'Publisert',

  /** Label for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.live-edit.label': 'Publiser',

  /** Tooltip for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.live-edit.tooltip':
    '"Live Edit" er skrudd på for denne dokumenttypen og publisering skjer automatisk når du gjør endringer',

  /** Fallback tooltip for the "Publish" document action when publish is invoked for a document with live edit enabled.*/
  'action.publish.live-edit.publish-disabled':
    'Kan ikke publisere fordi "Live Edit" er skrudd på for denne dokumenttypen.',

  /** Tooltip when the "Publish" document action is disabled due to validation issues */
  'action.publish.validation-issues.tooltip': 'Valideringsfeil må rettes før det kan publiseres',

  /** Tooltip when publish button is disabled because the document is already published.*/
  'action.publish.already-published.tooltip': 'Publisert for {{timeSincePublished}} siden',

  /** Tooltip when publish button is disabled because the document is already published, and published time is unavailable.*/
  'action.publish.already-published.no-time-ago.tooltip': 'Allerede publisert',

  /** Tooltip when publish button is disabled because there are no changes.*/
  'action.publish.no-changes.tooltip': 'Ingen upubliserte endringer',

  /** Tooltip when publish button is waiting for validation and async tasks to complete.*/
  'action.publish.waiting': 'Venter på at andre oppgaver skal fullføre',

  /** --- DELETE ACTION --- **/
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.delete.disabled.not-ready': 'Operasjonen er ikke klar',

  /** Tooltip when action button is disabled because the document does not exist */
  'action.delete.disabled.nothing-to-delete':
    'Dette dokumentet eksisterer ikke eller har allerede blitt slettet',

  /** Label for the "Delete" document action button */
  'action.delete.label': 'Slett',

  /** Label for the "Delete" document action while the document is being deleted */
  'action.delete.running.label': 'Sletter…',

  /** --- DISCARD CHANGES ACTION --- **/
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.discard-changes.disabled.not-ready': 'Operasjonen er ikke klar',

  /** Label for the "Discard changes" document action */
  'action.discard-changes.label': 'Forkast endringer',

  /** Tooltip when action is disabled because the document has no unpublished changes */
  'action.discard-changes.disabled.no-change': 'Dette dokumentet har ingen endringer',

  /** Tooltip when action is disabled because the document is not published */
  'action.discard-changes.disabled.not-published': 'Dette dokumentet er ikke publisert',

  /** Message prompting the user to confirm discarding changes */
  'action.discard-changes.confirm-dialog.confirm-discard-changes':
    'Er du sikker på at du vil forkaste alle endringer siden forrige gang dette dokumentet ble publisert?',

  /** --- DUPLICATE ACTION --- */
  /** Tooltip when action is disabled because the operation is not ready   */
  'action.duplicate.disabled.not-ready': 'Operasjonen er ikke klar',

  /** Tooltip when action is disabled because the document doesn't exist */
  'action.duplicate.disabled.nothing-to-duplicate':
    'Dette dokumentet er tomt og kan ikke dupliseres',

  /** Label for the "Duplicate" document action */
  'action.duplicate.label': 'Dupliser',

  /** Label for the "Duplicate" document action while the document is being duplicated */
  'action.duplicate.running.label': 'Dupliserer…',

  /** --- UNPUBLISH ACTION --- */
  /** Tooltip when action is disabled because the operation is not ready   */
  'action.unpublish.disabled.not-ready': 'Operasjonen er ikke klar',

  /** Label for the "Unpublish" document action */
  'action.unpublish.label': 'Avpubliser',

  /** Tooltip when action is disabled because the document is not already published */
  'action.unpublish.disabled.not-published': 'Dette dokumentet er ikke publisert',

  /** Fallback tooltip for the Unpublish document action when publish is invoked for a document with live edit enabled.*/
  'action.unpublish.live-edit.disabled':
    'Dette dokumentet har "Live Edit" skrudd på og kan ikke avpubliseres',

  /** --- RESTORE ACTION --- */
  /** Label for the "Restore" document action */
  'action.restore.label': 'Gjenopprett',

  /** Fallback tooltip for when user is looking at the initial version */
  'action.restore.disabled.cannot-restore-initial': 'Kan ikke gjenopprette til første version',

  /** Default tooltip for the action */
  'action.restore.tooltip': 'Gjenopprett til denne versjonen',

  /** Message prompting the user to confirm that they want to restore to an earlier version*/
  'action.restore.confirm-dialog.confirm-discard-changes':
    'Er du sikker på at du vil gjenopprette til valgte versjon?',

  /** --- PUBLISH STATUS BUTTON --- */
  /** Accessibility label indicating when the document was last updated, in relative time, eg "2 hours ago" */
  'status-bar.publish-status-button.last-updated-time.aria-label':
    'Sist oppdatert {{relativeTime}}',

  /** Accessibility label indicating when the document was last published, in relative time, eg "3 weeks ago" */
  'status-bar.publish-status-button.last-published-time.aria-label':
    'Sist publisert {{relativeTime}}',

  /** Text for tooltip showing explanation of timestamp/relative time, eg "Last updated <RelativeTime/>" */
  'status-bar.publish-status-button.last-updated-time.tooltip': 'Sist oppdatert <RelativeTime/>',

  /** Text for tooltip showing explanation of timestamp/relative time, eg "Last published <RelativeTime/>" */
  'status-bar.publish-status-button.last-published-time.tooltip': 'Sist publisert <RelativeTime/>',

  /** --- REVIEW CHANGES BUTTON --- */
  /** Label for button when status is syncing */
  'status-bar.review-changes-button.status.syncing.text': 'Lagrer...',

  /** Label for button when status is saved */
  'status-bar.review-changes-button.status.saved.text': 'Lagret!',

  /** Primary text for tooltip for the button */
  'status-bar.review-changes-button.tooltip.text': 'Se endringer',

  /** Text for the secondary text for tooltip for the button */
  'status-bar.review-changes-button.tooltip.changes-saved': 'Endringer lagret',

  /** Aria label for the button */
  'status-bar.review-changes-button.aria-label': 'Se endringer',

  /** --- DOCUMENT JSON INSPECTOR --- */
  /** Title shown for menu item that opens the "Inspect" dialog */
  'document-inspector.menu-item.title': 'Inspiser',

  /** The title shown in the dialog header, when inspecting a valid document */
  'document-inspector.dialog.title': 'Inspiserer <DocumentTitle/>',

  /** The title shown in the dialog header, when the document being inspected is not created yet/has no value */
  'document-inspector.dialog.title-no-value': 'Ingen verdi',

  /** The "parsed" view mode, meaning the JSON is searchable, collapsible etc */
  'document-inspector.view-mode.parsed': 'Behandlet',

  /** The "raw" view mode, meaning the JSON is presented syntax-highlighted, but with no other features - optimal for copying */
  'document-inspector.view-mode.raw-json': 'Rå JSON',

  /** --- "PRODUCTION PREVIEW", eg link to content --- */
  'production-preview.menu-item.title': 'Åpne forhåndsvisning',

  /** -- DESK PANES -- */
  /** The tool tip for the split pane button on the document panel header */
  'buttons.split-pane-button.tooltip': 'Del panel til høyre',

  /** The aria-label for the split pane button on the document panel header */
  'buttons.split-pane-button.aria-label': 'Del panel til høyre',

  /** The title for the close button on the split pane on the document panel header */
  'buttons.split-pane-close-button.title': 'Lukk delt panel',

  /** The title for the close group button on the split pane on the document panel header */
  'buttons.split-pane-close-group-button.title': 'Lukk panelgruppe',

  /** The text content for the deleted document banner */
  'banners.deleted-document-banner.text': 'Dette dokumentet har blitt slettet.',

  /** The text for the restore button on the deleted document banner */
  'banners.deleted-document-banner.restore-button.text': 'Gjenopprett nyeste versjon',

  /** The text for the reference change banner if the reason is that the reference has been changed */
  'banners.reference-changed-banner.reason-changed.text':
    'Denne referansen har endret seg siden du åpnet den.',

  /** The text for the reload button */
  'banners.reference-changed-banner.reason-changed.reload-button.text':
    'Last inn referansen på nytt',

  /** The text for the reference change banner if the reason is that the reference has been deleted */
  'banners.reference-changed-banner.reason-removed.text':
    'Denne referansen har blitt fjernet siden du åpnet den.',

  /** The text for the close button */
  'banners.reference-changed-banner.reason-removed.close-button.text': 'Lukk referansen',

  /** The text for the permission check banner if there is only one role */
  'banners.permission-check-banner.singular-role.text':
    'Din rolle {{roles}} har ikke tillatelser til å {{requiredPermission}} dette dokumentet.',

  /** The text for the permission check banner if there is are multiple roles */
  'banners.permission-check-banner.plural-roles.text':
    'Dine roller {{roles}} har ikke tillatelser til å {{requiredPermission}} dette dokumentet.',

  /** The text for when a form is hidden */
  'document-view.form-view.form-hidden': 'Dette skjemaet er skjult',

  /** The text for when the form view is loading a document */
  'document-view.form-view.loading': 'Laster dokument…',

  /** The title of the sync lock toast on the form view */
  'document-view.form-view.sync-lock-toast.title': 'Synkroniserer dokument…',

  /** The description of the sync lock toast on the form view */
  'document-view.form-view.sync-lock-toast.description':
    'Vennligst vent mens dokumentet synkroniseres. Dette skjer vanligvis rett etter at dokumentet har blitt publisert, og det bør ikke ta mer enn noen få sekunder',

  /** The title of the reconnecting toast */
  'panes.document-pane-provider.reconnecting.title': 'Forbindelse mistet. Kobler til på nytt…',

  /** The loading message for the document not found pane */
  'panes.document-pane.document-not-found.loading': 'Laster dokument…',

  /** The title of the document not found pane if the schema is known */
  'panes.document-pane.document-not-found.title': 'Dokumentet ble ikke funnet',

  /** The text of the document not found pane if the schema is known */
  'panes.document-pane.document-not-found.text':
    'Dokumenttypen er ikke definert, og et dokument med identifikatoren <Code>{{id}}</Code> kunne ikke bli funnet.',

  /** The title of the document not found pane if the schema is not found or unknown */
  'panes.document-pane.document-unknown-type.title':
    'Ukjent dokumenttype: <Code>{{documentType}}</Code>',

  /** The text of the document not found pane if the schema is not found */
  'panes.document-pane.document-unknown-type.text':
    'Dette dokumentet har skjematypen <Code>{{documentType}}</Code>, som ikke er definert som en type i det lokale innholdsstudioets skjema.',

  /** The title of the document not found pane if the schema is unknown */
  'panes.document-pane.document-unknown-type.without-schema.text':
    'Dette dokumentet eksisterer ikke, og ingen skjematype ble spesifisert for det.',

  /** The text of the document list pane if more than a maximum number of documents are returned */
  'panes.document-list-pane.max-items.text': 'Viser maksimalt {{limit}} dokumenter',

  /** The text of the document list pane if no documents are found */
  'panes.document-list-pane.no-documents.text': 'Ingen resultater funnet',

  /** The text of the document list pane if no documents are found matching specified criteria */
  'panes.document-list-pane.no-matching-documents.text': 'Ingen dokumenter funnet som samsvarer',

  /** The text of the document list pane if no documents are found for a specified type */
  'panes.document-list-pane.no-documents-of-type.text': 'Ingen dokumenter av denne typen',

  /** The error title on the document list pane */
  'panes.document-list-pane.error.title': 'Kunne ikke hente listeobjekter',

  /** The error text on the document list pane */
  'panes.document-list-pane.error.text': 'Feil: <Code>{{error}}</Code>',

  /** The text for the retry button on the document list pane */
  'panes.document-list-pane.error.retry-button.text': 'Prøv på nytt',

  /** The summary title when displaying an error for a document operation result */
  'panes.document-operation-results.error.summary.title': 'Detaljer',

  /** The text when a delete operation failed  */
  'panes.document-operation-results.operation-error_delete':
    'En feil oppstod under forsøket på å slette dette dokumentet. Dette betyr vanligvis at det er andre dokumenter som refererer til det.',

  /** The text when an unpublish operation failed  */
  'panes.document-operation-results.operation-error_unpublish':
    'En feil oppstod under forsøket på å avpublisere dette dokumentet. Dette betyr vanligvis at det er andre dokumenter som refererer til det.',

  /** The text when a generic operation failed  */
  'panes.document-operation-results.operation-error': 'En feil oppstod under {{context}}',

  /** The text when a publish operation succeeded  */
  'panes.document-operation-results.operation-success_publish': 'Dokumentet ble publisert',

  /** The text when an unpublish operation succeeded  */
  'panes.document-operation-results.operation-success_unpublish':
    'Dokumentet ble avpublisert. Et utkast har blitt opprettet fra den siste publiserte versjonen.',

  /** The text when a discard changes operation succeeded  */
  'panes.document-operation-results.operation-success_discardChanges':
    'Alle endringer siden siste publisering har nå blitt forkastet. Det forkastede utkastet kan fortsatt gjenopprettes fra historikken',

  /** The text when a delete operation succeded  */
  'panes.document-operation-results.operation-success_delete': 'Dokumentet ble slettet',

  /** The text when a generic operation succeded (fallback, generally not shown)  */
  'panes.document-operation-results.operation-success': 'Utførte {{context}} på dokumentet',

  /** The text used in the document header title if creating a new item */
  'panes.document-header-title.new.text': 'Ny {{schemaType}}',

  /** The text used in the document header title if there is an error */
  'panes.document-header-title.error.text': 'Feil: {{error}}',

  /** The text used in the document header title if no other title can be determined */
  'panes.document-header-title.untitled.text': 'Uten tittel',

  /** The aria-label for the search input on the document list pane */
  'panes.document-list-pane.search-input.aria-label': 'Søk i liste',

  /** The search input for the search input on the document list pane */
  'panes.document-list-pane.search-input.placeholder': 'Søk i liste',

  /** The action menu button aria-label */
  'buttons.action-menu-button.aria-label': 'Åpne dokumenthandlinger',

  /** the placeholder text for the search input on the inspect dialog */
  'inputs.inspect-dialog.search.placeholder': 'Søk',

  /** -- UNKNOWN PANE TYPE */
  /** The text to display when type is missing */
  'panes.unknown-pane-type.missing-type.text':
    'Strukturelement mangler påkrevd <Code>type</Code>-egenskap.',

  /** The text to display when type is unknown */
  'panes.unknown-pane-type.unknown-type.text':
    'Strukturelement av type <Code>{{type}}</Code> er ikke en kjent enhet.',

  /** The title of the unknown pane */
  'panes.unknown-pane-type.title': 'Ukjent paneltype',

  /** --- DOCUMENT TITLE --- */
  /** The text shown if a document's title via a preview value cannot be determined due to an unknown schema type */
  'doc-title.unknown-schema-type.text': 'Ukjent skjematype: {{schemaType}}',

  /** The text shown if there was an error while getting the document's title via a preview value */
  'doc-title.error.text': 'Feil: {{errorMessage}}',

  /** The text shown if the preview value for a document is non-existent or empty */
  'doc-title.fallback.text': 'Uten tittel',

  /** --- PANE ITEM --- */
  /** The text shown in the tooltip of pane item previews of documents if there are unpublished edits */
  'pane-item.draft-status.has-draft.tooltip': 'Redigert <RelativeTime/>',

  /** The text shown in the tooltip of pane item previews of documents if there are no unpublished edits */
  'pane-item.draft-status.no-draft.tooltip': 'Ingen upubliserte endringer',

  /** The text shown in the tooltip of pane item previews of documents if there are unpublished edits */
  'pane-item.published-status.has-published.tooltip': 'Publisert <RelativeTime/>',

  /** The text shown in the tooltip of pane item previews of documents if there are no unpublished edits */
  'pane-item.published-status.no-published.tooltip': 'Ingen publiserte endringer',

  /** The title tor pane item previews if there isn't a matching schema type found */
  'pane-item.missing-schema-type.title':
    'Ingen skjema funnet for type <Code>{{documentType}}</Code>',

  /** The subtitle tor pane item previews if there isn't a matching schema type found */
  'pane-item.missing-schema-type.subtitle': 'Dokument: <Code>{{documentId}}</Code>',

  /** --- CONFIRM DELETE DIALOG e.g. when trying to delete or unpublished a document --- */
  /** The header of the confirm delete dialog */
  'confirm-delete-dialog.header.text_delete': 'Slett dokument?',
  /** The header of the confirm delete dialog */
  'confirm-delete-dialog.header.text_unpublish': 'Avpubliser dokument?',

  /** The text that appears while the referring documents are queried */
  'confirm-delete-dialog.loading.text': 'Ser etter refererende dokumenter…',

  /** The text in the "Cancel" button in the confirm delete dialog that cancels the action and closes the dialog */
  'confirm-delete-dialog.cancel-button.text': 'Avbryt',

  /** The text in the "Delete now" button in the confirm delete dialog that confirms the action */
  'confirm-delete-dialog.confirm-button.text_delete': 'Slett nå',
  /** The text in the "Unpublish now" button in the confirm delete dialog that confirms the action */
  'confirm-delete-dialog.confirm-button.text_unpublish': 'Avpubliser nå',
  /** The text in the "Delete anyway" button in the confirm delete dialog that confirms the action */
  'confirm-delete-dialog.confirm-anyway-button.text_delete': 'Slett uansett',
  /** The text in the "Unpublish anyway" button in the confirm delete dialog that confirms the action */
  'confirm-delete-dialog.confirm-anyway-button.text_unpublish': 'Avpubliser uansett',

  /** If no referring documents are found, this text appears above the cancel and confirmation buttons */
  'confirm-delete-dialog.confirmation.text_delete':
    'Er du sikker på at du vil slette «<DocumentTitle/>»?',
  /** If no referring documents are found, this text appears above the cancel and confirmation buttons */
  'confirm-delete-dialog.confirmation.text_unpublish':
    'Er du sikker på at du vil avpublisere «<DocumentTitle/>»?',

  /** Tells the user the count of how many other referring documents there are before listing them. (singular) */
  'confirm-delete-dialog.referring-document-count.text_one':
    '1 dokument refererer til «<DocumentTitle/>»',
  /** Tells the user the count of how many other referring documents there are before listing them. (plural) */
  'confirm-delete-dialog.referring-document-count.text_other':
    '{{count}} dokumenter refererer til «<DocumentTitle/>»',

  /** Describes the list of documents that refer to the one trying to be deleted (delete) */
  'confirm-delete-dialog.referring-documents-descriptor.text_delete':
    'Du kan kanskje ikke slette «<DocumentTitle/>» fordi de følgende dokumentene refererer til det:',
  /** Describes the list of documents that refer to the one trying to be deleted (unpublish) */
  'confirm-delete-dialog.referring-documents-descriptor.text_unpublish':
    'Du kan kanskje ikke avpublisere «<DocumentTitle/>» fordi de følgende dokumentene refererer til det:',

  /** Warns the user of affects to other documents if the action is confirmed (delete) */
  'confirm-delete-dialog.referential-integrity-disclaimer.text_delete':
    'Hvis du sletter dette dokumentet, vil dokumenter som refererer til det ikke lenger kunne få tilgang til det.',
  /** Warns the user of affects to other documents if the action is confirmed (unpublish) */
  'confirm-delete-dialog.referential-integrity-disclaimer.text_unpublish':
    'Hvis du avpubliserer dette dokumentet, vil dokumenter som refererer til det ikke lenger kunne få tilgang til det.',

  /** The header for the project ID column in the list of cross-dataset references found */
  'confirm-delete-dialog.cdr-table.project-id.label': 'Prosjekt-ID',
  /** The header for the dataset column in the list of cross-dataset references found */
  'confirm-delete-dialog.cdr-table.dataset.label': 'Datasett',
  /** The header for the document ID column in the list of cross-dataset references found */
  'confirm-delete-dialog.cdr-table.document-id.label': 'Dokument-ID',

  /** Appears when hovering over the copy button to copy */
  'confirm-delete-dialog.cdr-table.copy-id-button.tooltip': 'Kopier ID til utklippstavlen',
  /** The toast title when the copy button has been clicked */
  'confirm-delete-dialog.cdr-table.id-copied-toast.title':
    'Kopierte dokument-ID til utklippstavlen!',

  /** Appears when unable to render a document preview in the referring document list */
  'confirm-delete-dialog.preview-item.preview-unavailable.title':
    'Forhåndsvisning ikke tilgjengelig',
  /** Appears when unable to render a document preview in the referring document list */
  'confirm-delete-dialog.preview-item.preview-unavailable.subtitle': 'ID: {{documentId}}',

  /** The text that appears in the title `<summary>` that includes the list of CDRs (singular) */
  'confirm-delete-dialog.cdr-summary.title_one': '{{documentCount}} i et annet datasett',
  /** The text that appears in the title `<summary>` that includes the list of CDRs (plural) */
  'confirm-delete-dialog.cdr-summary.title_other': '{{documentCount}} i {{count}} datasett',

  /** Used in `confirm-delete-dialog.cdr-summary.title` */
  'confirm-delete-dialog.cdr-summary.document-count_one': '1 dokument',
  /** Used in `confirm-delete-dialog.cdr-summary.title` */
  'confirm-delete-dialog.cdr-summary.document-count_other': '{{count}} dokumenter',

  /** The text that appears in the subtitle `<summary>` that lists the datasets below the title */
  'confirm-delete-dialog.cdr-summary.subtitle_one': 'Datasett: {{datasets}}',
  /** The text that appears in the subtitle `<summary>` that lists the datasets below the title */
  'confirm-delete-dialog.cdr-summary.subtitle_other': 'Datasett: {{datasets}}',
  /** The text that appears in the subtitle `<summary>` that lists the datasets below the title */
  'confirm-delete-dialog.cdr-summary.subtitle_unavailable_one': 'Utilgjengelig datasett',
  /** The text that appears in the subtitle `<summary>` that lists the datasets below the title */
  'confirm-delete-dialog.cdr-summary.subtitle_unavailable_other': 'Utilgjengelige datasett',

  /** Shown if there are references to other documents but the user does not have the permission to see the relevant document IDs */
  'confirm-delete-dialog.other-reference-count.title_one': '1 annen referanse ikke vist',
  /** Shown if there are references to other documents but the user does not have the permission to see the relevant document IDs */
  'confirm-delete-dialog.other-reference-count.title_other': '{{count}} andre referanser ikke vist',
  /** Text in the tooltip of this component if hovering over the info icon */
  'confirm-delete-dialog.other-reference-count.tooltip':
    'Vi kan ikke vise metadata for disse referansene på grunn av en manglende tilgang til de relaterte datasettene.',

  /** The header of the confirm delete dialog if an error occurred while the confirm delete dialog was open. */
  'confirm-delete-dialog.error.title.text': 'Feil',

  /** The text in the retry button of the confirm delete dialog if an error occurred. */
  'confirm-delete-dialog.error.retry-button.text': 'Prøv på nytt',

  /** The text body of the error dialog. */
  'confirm-delete-dialog.error.message.text':
    'En feil oppsto mens refererende dokumenter ble lastet inn.',

  /** --- NO DOCUMENT TYPES SCREEN i.e. appears when there are no document types defined and the desk tool has nothing to render --- */
  /** The title of the no document type screen */
  'no-document-types-screen.title': 'Ingen dokumenttyper',

  /** The subtitle of the no document type screen that appears directly below the title */
  'no-document-types-screen.subtitle': 'Vennligst definer minst én dokumenttype i ditt skjema.',

  /** The link text of the no document type screen that appears directly below the subtitle */
  'no-document-types-screen.link-text': 'Lær hvordan du legger til en dokumenttype →',

  /** --- STRUCTURE ERROR SCREEN i.e. appears if there was an error while rendering the structure from the structure builder --- */
  /** The header that appears at the top of the error screen */
  'structure-error.header.text': 'Oppdaget en feil mens strukturen ble lest',

  /** Labels the structure path of the structure error screen */
  'structure-error.structure-path.label': 'Strukturvei',
  /** Labels the error message or error stack of the structure error screen */
  'structure-error.error.label': 'Feil',

  /** The text that appears in side the documentation link */
  'structure-error.docs-link.text': 'Vis dokumentasjon',

  /** The text in the reload button to retry rendering the structure */
  'structure-error.reload-button.text': 'Last på nytt',

  /** --- PANE HEADER MENU --- */
  /** tooltip text (via `title` attribute) for the menu button */
  'pane-header.context-menu-button.tooltip': 'Vis meny',

  /** The `aria-label` for the disabled button in the pane header if create permissions are granted */
  'pane-header.disabled-created-button.aria-label': 'Utilstrekkelig tilgang',

  /** Appears in a document list pane header if there are more than one option for create. This is the label for that menu */
  'pane-header.create-menu.label': 'Opprett',

  /** --- Insufficient permissions message --- */
  /** the loading messaging for when the tooltip is still loading permission info */
  'insufficient-permissions-message-tooltip.loading-text': 'Laster…',
}

export default deskLocaleStrings
