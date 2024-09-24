import {type Mutation} from '../mutations'

/**
 * An entry in the transaction log
 *
 * @internal
 */
export interface TransactionLogEvent {
  /**
   * ID of transaction
   */
  id: string

  /**
   * ISO-formatted timestamp (zulu-time) of when the transaction happened
   */
  timestamp: string

  /**
   * User ID of the user who performed the transaction
   */
  author: string

  /**
   * Document IDs involved in this transaction
   */
  documentIDs: string[]
}

/**
 * An entry in the transaction log that includes the effects of the transaction.
 * Used when asking the transaction log to include effects in mendoza format,
 * eg `?effectFormat=mendoza`
 *
 * @internal
 */
export interface TransactionLogEventWithEffects extends TransactionLogEvent {
  /**
   * Object of effects, where the key is the document ID affected and the value
   * is the effect pair, eg `{apply: MendozaPatch, revert: MendozaPatch}`
   */
  effects: Record<string, MendozaEffectPair | undefined>
}

/**
 * An entry in the transaction log that includes the mutations that were performed.
 * Used when asking the transaction log not to exclude the mutations,
 * eg `excludeMutations=false`
 *
 * @internal
 */
export interface TransactionLogEventWithMutations extends TransactionLogEvent {
  /**
   * Array of mutations that occurred in this transaction. Note that the transaction
   * log has an additional mutation type not typically seen in other APIs;
   * `createSquashed` ({@link CreateSquashedMutation}).
   */
  mutations: TransactionLogMutation[]
}

/**
 * Mutation type used when the document has passed the threshold of the
 * "history retention" - any transactions done prior to the threshold gets "squashed"
 * into a single "create" transaction.
 *
 * @internal
 */
export interface CreateSquashedMutation {
  createSquashed: {
    /**
     * The user IDs of all the users who contributed to the document prior to the squashing
     */
    authors: string[]

    /**
     * User ID of the person who initially created the document
     */
    createdBy: string

    /**
     * ISO-formatted timestamp (zulu-time) of when the document as initially created
     */
    createdAt: string

    /**
     * The document as it exists after squashing has occurred
     */
    document: {
      _id: string
      _type: string
      [key: string]: unknown
    }
  }
}

/**
 * A mutation that can occur in the transaction log, which includes the
 * {@link CreateSquashedMutation} mutation type.
 *
 * @internal
 */
export type TransactionLogMutation = Mutation | CreateSquashedMutation

/**
 * A mendoza patch. These are not human-readable patches, but are optimized to
 * take as little space as possible, while still being represented by plain JSON.
 * See {@link https://www.sanity.io/blog/mendoza}
 *
 * @internal
 */
export type MendozaPatch = unknown[]

/**
 * A pair of mendoza patches that can either be _applied_ (to perform the effect),
 * or _reverted_ (to undo the effect). Requires the exact, previous version of the
 * document when applying - any difference might have unexpected consequences.
 *
 * @internal
 */
export interface MendozaEffectPair {
  apply: MendozaPatch
  revert: MendozaPatch
}
