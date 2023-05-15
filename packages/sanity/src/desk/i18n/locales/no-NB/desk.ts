import {DeskTranslations} from '../types/desk'
import {deskI18nNamespace} from '../../i18nNamespaces'
import {defineBundle} from 'sanity'

export const deskI18nNamespaceStrings: Partial<DeskTranslations> = {
  /** Label for the "Publish" document action when there are pending changes.*/
  'action.publish.draft.label': 'Publiser',

  /** Label for the "Publish" document action while publish is being executed.*/
  'action.publish.running.label': 'Publiserer…',

  /** Label for the "Publish" document action when there are no changes.*/
  'action.publish.published.label': 'Publisert',

  /** Label for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.liveEdit.label': 'Publiser',

  /** Tooltip for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.liveEdit.tooltip':
    '"Live Edit" er skrudd på for denne dokumenttypen og´publisering skjer automatisk når du gjør endringer',

  /** Fallback tooltip for the "Publish" document action when publish is invoked for a document with live edit enabled.*/
  'action.publish.liveEdit.publishDisabled':
    'Kan ikke publsere fordi liveEdit er skrudd på for denne dokumenttypen.',

  /** Tooltip when the "Publish" document action is disabled due to validation issues */
  'action.publish.validationIssues.tooltip':
    'Valideringsfeil som må rettes før dokumentet kan publiseres',

  /** Tooltip when publish button is disabled because the document is already published.*/
  'action.publish.alreadyPublished.tooltip': 'Publisert for {{timeSincePublished}} siden',

  /** Tooltip when publish button is disabled because the document is already published, and published time is unavailable.*/
  'action.publish.alreadyPublished.noTimeAgo.tooltip': 'Allerede publisert',

  /** Tooltip when publish button is disabled because there are no changes.*/
  'action.publish.tooltip.noChanges': 'Ingen upubliserte endringer',

  /** Tooltip when publish button is disabled because the studio is not ready.*/
  'action.publish.disabled.notReady': 'Operasjonen er ikke klar',

  /** Tooltip when publish button is waiting for validation and async tasks to complete.*/
  'action.publish.waiting': 'Venter på at andre oppgaver skal fullføre',
}

export default defineBundle({
  namespace: deskI18nNamespace,
  resources: deskI18nNamespaceStrings,
})
