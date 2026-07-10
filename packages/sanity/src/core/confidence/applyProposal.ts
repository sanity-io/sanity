import {filter, firstValueFrom, timeout} from 'rxjs'

import {type DocumentStore} from '../store'
import {type AgentProposal} from './mock/types'

/**
 * Applies an accepted proposal as a REAL document mutation through the
 * standard edit-operations pipeline: patch the field, then commit. This is
 * the accept-gate contract — the mock proposes, but nothing touches the
 * document until a human accepts, and acceptance is a real change.
 *
 * The operations pipeline is cold (`execute()` only emits a call); subscribe
 * to the pair's operation events before executing so it runs — same
 * discipline as the structure list surfaces.
 *
 * @internal
 */
export async function applyProposal(
  documentStore: DocumentStore,
  proposal: AgentProposal,
): Promise<'done' | 'ERROR'> {
  const {documentId, documentType, fieldName, diff} = proposal

  try {
    const operations = await firstValueFrom(
      documentStore.pair.editOperations(documentId, documentType).pipe(
        filter((ops) => ops.patch.disabled !== 'NOT_READY'),
        timeout({first: 15_000}),
      ),
    )
    if (operations.patch.disabled || operations.commit.disabled === 'NOT_READY') return 'ERROR'

    const events$ = documentStore.pair.operationEvents(documentId, documentType)

    const patchResult = firstValueFrom(
      events$.pipe(
        filter((event) => event.op === 'patch'),
        timeout({first: 30_000}),
      ),
    )
    operations.patch.execute([{set: {[fieldName]: diff.after}}])
    const patchEvent = await patchResult
    if (patchEvent.type !== 'success') return 'ERROR'

    const commitResult = firstValueFrom(
      events$.pipe(
        filter((event) => event.op === 'commit'),
        timeout({first: 30_000}),
      ),
    )
    operations.commit.execute()
    const commitEvent = await commitResult
    return commitEvent.type === 'success' ? 'done' : 'ERROR'
  } catch {
    return 'ERROR'
  }
}
