import type {DeskLocaleResourceKeys} from 'sanity/desk'

const deskResources: Record<DeskLocaleResourceKeys, string> = {
  /** --- PUBLISH ACTION --- */
  /** Tooltip when action is disabled because the studio is not ready.*/
  'action.publish.disabled.notReady': 'Operasjonen er ikke klar',

  /** Label for action when there are pending changes.*/
  'action.publish.draft.label': 'Publiser',

  /** Label for the "Publish" document action while publish is being executed.*/
  'action.publish.running.label': 'Publiserer…',

  /** Label for the "Publish" document action when there are no changes.*/
  'action.publish.published.label': 'Publisert',

  /** Label for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.liveEdit.label': 'Publiser',

  /** Tooltip for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.liveEdit.tooltip':
    '"Live Edit" er skrudd på for denne dokumenttypen og publisering skjer automatisk når du gjør endringer',

  /** Fallback tooltip for the "Publish" document action when publish is invoked for a document with live edit enabled.*/
  'action.publish.liveEdit.publishDisabled':
    'Kan ikke publisere fordi "Live Edit" er skrudd på for denne dokumenttypen.',

  /** Tooltip when the "Publish" document action is disabled due to validation issues */
  'action.publish.validationIssues.tooltip':
    'Valideringsfeil som må rettes før dokumentet kan publiseres',

  /** Tooltip when publish button is disabled because the document is already published.*/
  'action.publish.alreadyPublished.tooltip': 'Publisert for {{timeSincePublished}} siden',

  /** Tooltip when publish button is disabled because the document is already published, and published time is unavailable.*/
  'action.publish.alreadyPublished.noTimeAgo.tooltip': 'Allerede publisert',

  /** Tooltip when publish button is disabled because there are no changes.*/
  'action.publish.tooltip.noChanges': 'Ingen upubliserte endringer',

  /** Tooltip when publish button is waiting for validation and async tasks to complete.*/
  'action.publish.waiting': 'Venter på at andre oppgaver skal fullføre',

  /** --- DELETE ACTION --- **/
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.delete.disabled.notReady': 'Operasjonen er ikke klar',

  /** Tooltip when action button is disabled because the document does not exist */
  'action.delete.disabled.nothingToDelete':
    'Dette dokumentet eksisterer ikke eller har allerede blitt slettet',

  /** Label for the "Delete" document action button */
  'action.delete.label': 'Slett',

  /** Label for the "Delete" document action while the document is being deleted */
  'action.delete.running.label': 'Sletter…',
}

export default deskResources
