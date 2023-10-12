import type {DeskLocaleResourceKeys} from 'sanity/desk'

const deskResources: Record<DeskLocaleResourceKeys, string> = {
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
  'action.publish.validation-issues.tooltip':
    'Valideringsfeil som må rettes før dokumentet kan publiseres',

  /** Tooltip when publish button is disabled because the document is already published.*/
  'action.publish.already-published.tooltip': 'Publisert for {{timeSincePublished}} siden',

  /** Tooltip when publish button is disabled because the document is already published, and published time is unavailable.*/
  'action.publish.already-published.no-time-ago.tooltip': 'Allerede publisert',

  /** Tooltip when publish button is disabled because there are no changes.*/
  'action.publish.tooltip.no-changes': 'Ingen upubliserte endringer',

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
  'action.duplicate.label': 'Duplisèr',

  /** Label for the "Duplicate" document action while the document is being duplicated */
  'action.duplicate.running.label': 'Duplisèrer…',

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
}

export default deskResources
