import {useToast} from '@sanity/ui/toast'
import throttle from 'lodash-es/throttle.js'
import {type RefObject, useEffect, useEffectEvent} from 'react'
import {filter, take, timeout} from 'rxjs'
import {useDocumentStore} from 'sanity'
import {getIdPair} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useTranslation} from 'sanity/i18n'

import {type VisionCodeMirrorHandle} from '../../codemirror/VisionCodeMirror'
import {visionLocaleNamespace} from '../../i18n'
import {parseQueryUrl} from '../../util/parseQueryUrl'
import {useVisionActor, useVisionSelector} from '../store/VisionActorContext'
import {selectDatasets} from '../store/visionMachine'
import {
  haveSameOptions,
  mergeText,
  readSharedTabFields,
  type SharedTabFields,
  sharedTabPatch,
} from '../util/sharedTabDocument'

/** Edits are sent as often as the document form autosaves them */
const COMMIT_THROTTLE_MS = 1_000
/** How long a tab that stops syncing waits for its last edits to be saved */
const FLUSH_TIMEOUT_MS = 10_000

export interface SharedTabSyncOptions {
  tabId: string
  /** The shared query the tab is linked to, whoever authored it; nothing syncs without one */
  sharedId: string | undefined
  queryEditorRef: RefObject<VisionCodeMirrorHandle | null>
  paramsEditorRef: RefObject<VisionCodeMirrorHandle | null>
  /** The URL of the request for a query and params, as older studios read a shared query */
  buildUrl: (query: string, rawParams: string) => string | undefined
}

/**
 * Edits a shared tab together with everyone who has it open, the way a live-edited document is
 * edited: the tab's query, params and options are fields of its `vision.sharedQuery` document,
 * checked out from the document store and patched through its buffer, which sends text edits
 * as diff-match-patch and rebases them over the edits that arrive meanwhile. A collaborator's
 * edit is merged into the editor as the characters it changed, so the cursor and anything typed
 * but not sent yet stay where they are.
 *
 * Only a shown tab syncs: a hidden one has its effects torn down, and takes the document as it
 * is when it is shown again.
 */
export function useSharedTabSync({
  tabId,
  sharedId,
  queryEditorRef,
  paramsEditorRef,
  buildUrl,
}: SharedTabSyncOptions): void {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVisionActor()
  const documentStore = useDocumentStore()
  const datasets = useVisionSelector(selectDatasets)

  const readTab = useEffectEvent(() =>
    actorRef.getSnapshot().context.tabs.find((tab) => tab.id === tabId),
  )
  const readFields = useEffectEvent((doc: Record<string, unknown>) =>
    readSharedTabFields(doc, typeof doc.url === 'string' ? parseQueryUrl(doc.url, datasets) : null),
  )
  const urlFor = useEffectEvent((query: string, rawParams: string) => buildUrl(query, rawParams))
  const reportCommitError = useEffectEvent(() => {
    toast.push({
      id: `vision-shared-tab-sync-${tabId}`,
      closable: true,
      status: 'error',
      title: t('vision.tabs.sync-failed'),
    })
  })

  /** Takes in the document's fields as `next`, after it held `previous` (none on the first) */
  const applyFields = useEffectEvent(
    (previous: SharedTabFields | undefined, next: SharedTabFields) => {
      const tab = readTab()
      if (!tab) return

      const queryEditor = queryEditorRef.current
      const currentQuery = queryEditor?.getContent() ?? tab.query
      const query = previous ? mergeText(previous.query, next.query, currentQuery) : next.query
      if (query !== currentQuery) {
        queryEditor?.applyRemoteContent(query)
        actorRef.send({type: 'tab.setQuery', id: tabId, query})
      }

      // The params editor may hold an edit its debounce has not handed to the tab yet
      const paramsEditor = paramsEditorRef.current
      const currentParams = paramsEditor?.getContent() ?? tab.rawParams
      const rawParams = previous
        ? mergeText(previous.rawParams, next.rawParams, currentParams)
        : next.rawParams
      if (rawParams !== currentParams) {
        paramsEditor?.applyRemoteContent(rawParams)
        actorRef.send({type: 'tab.setParams', id: tabId, rawParams})
      }

      if (
        next.options &&
        !(previous?.options && haveSameOptions(previous.options, next.options)) &&
        !haveSameOptions(tab.options, next.options)
      ) {
        actorRef.send({type: 'tab.setOptions', id: tabId, options: next.options})
      }

      // A shared query is renamed from the Shared tabs drawer, which renames the tabs linked to
      // it in this studio; this takes a rename made in another one
      if (previous && next.title !== undefined && next.title !== previous.title) {
        actorRef.send({type: 'tab.rename', id: tabId, title: next.title})
      }
    },
  )

  useEffect(() => {
    if (!sharedId) return undefined
    const pair = documentStore.checkoutPair(getIdPair(sharedId))
    const {published} = pair

    // The document's fields as this tab's edits have left them, ahead of the server while
    // they are being sent; `undefined` until the document is loaded, and once it is deleted
    let synced: SharedTabFields | undefined
    let applying = false

    const commit = throttle(() => published.commit(), COMMIT_THROTTLE_MS, {
      leading: true,
      trailing: true,
    })

    function sendTabChanges() {
      if (!synced || applying) return
      const tab = readTab()
      if (!tab) return
      const patch = sharedTabPatch(synced, tab, urlFor(tab.query, tab.rawParams))
      if (!patch) return
      synced = {
        ...synced,
        query: tab.query,
        rawParams: tab.rawParams,
        options: synced.options ? tab.options : undefined,
      }
      published.mutate(published.patch([patch]))
      commit()
    }
    const events = published.events.subscribe((event) => {
      if (event.type !== 'snapshot' && event.type !== 'mutation' && event.type !== 'rebase') {
        return
      }
      const doc = event.document as Record<string, unknown> | null | undefined
      if (!doc) {
        synced = undefined
        return
      }
      const previous = synced
      const next = readFields(doc)
      // A document without the options takes the tab's, until an edit of them stores them
      synced = next.options ? next : {...next, options: previous?.options ?? readTab()?.options}
      if (event.type === 'mutation' && event.origin === 'local') return
      // The tab takes the fields one by one; what it holds in between is not an edit to send
      applying = true
      applyFields(previous, next)
      applying = false
      // What the tab holds now that the document does not (an edit merged in) is sent on
      sendTabChanges()
    })

    // The machine tells its subscribers about every change right away, so a tab edit is sent
    // in the same task, before a collaborator's edit can come in between
    const tabChanges = actorRef.subscribe(sendTabChanges)

    // A collaborator who may not edit the document sees their edits undone, as in a document
    const commitErrors = pair.commitError$
      .pipe(filter(Boolean))
      .subscribe(() => reportCommitError())

    return () => {
      tabChanges.unsubscribe()
      commitErrors.unsubscribe()
      commit.cancel()
      published.commit()
      // The pair is checked out for as long as its events are subscribed to, so they are kept
      // until the edits made last have been saved
      published.consistency$
        .pipe(filter(Boolean), take(1), timeout({first: FLUSH_TIMEOUT_MS}))
        .subscribe({complete: () => events.unsubscribe(), error: () => events.unsubscribe()})
    }
  }, [actorRef, documentStore, sharedId])
}
