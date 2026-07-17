import {type EditableSystemVariant, type SystemVariant} from '../types'
import {buildVariantDefinitionTitle} from './buildVariantSetDefinitions'
import {createVariantId} from './createVariantId'
import {VARIANT_SET_METADATA_KEY, type VariantSetReference} from './variantSet'
import {generateVariantSetPermutations, type VariantSetDimension} from './variantSetPermutations'

/**
 * One value in the edit table. `originalValue` is the value this entry started as (so a rename can
 * be told apart from a remove-plus-add); it is `null` for a value the user just added.
 *
 * @internal
 */
export interface DimensionValueEdit {
  originalValue: string | null
  value: string
}

/**
 * The edited value list for one dimension key. Only surviving entries are present — a value the
 * user removed is simply absent, which is how removals are detected against the reconstructed set.
 *
 * @internal
 */
export interface DimensionEdit {
  key: string
  values: DimensionValueEdit[]
}

/**
 * The reconciliation of a set edit against its existing member definitions. Nothing here is
 * written until the caller applies it, so it doubles as the preview shown before confirmation.
 *
 * @internal
 */
export interface VariantSetEditPlan {
  /** Renamed combinations: existing definitions patched in place (id and documents preserved). */
  updates: EditableSystemVariant[]
  /** Added combinations: brand-new definitions, deduped against what already exists. */
  creates: EditableSystemVariant[]
  /** Removed combinations with no documents: safe to delete. */
  deletes: {id: string; title: string}[]
  /** Removals blocked because a definition still contains documents (value kept intact). */
  blockedRemovals: {key: string; value: string; withDocuments: {id: string; title: string}[]}[]
  /** Renames skipped because the target value already exists on that key. */
  renameConflicts: {key: string; from: string; to: string}[]
}

/**
 * Rebuild a set's dimensions from its member definitions: each condition key mapped to the ordered,
 * de-duplicated set of values its children use. This is the authoritative table when there is no
 * set document (Option A), so it seeds the edit surface.
 *
 * @internal
 */
export function reconstructVariantSetDimensions(
  children: Pick<SystemVariant, 'conditions'>[],
): VariantSetDimension[] {
  const valuesByKey = new Map<string, string[]>()

  for (const child of children) {
    for (const [key, value] of Object.entries(child.conditions)) {
      const values = valuesByKey.get(key) ?? []
      if (!values.includes(value)) {
        values.push(value)
      }
      valuesByKey.set(key, values)
    }
  }

  return Array.from(valuesByKey, ([key, values]) => ({key, values}))
}

function titleFor(setName: string, conditions: Record<string, string>): string {
  return buildVariantDefinitionTitle(setName, conditions)
}

/**
 * Reconcile an edit of a variant set's values against its existing member definitions, without
 * writing anything. Value renames patch the matching definitions in place (propagation); added
 * values generate new deduped combinations; removed values delete their definitions unless one
 * still has documents, in which case that value's removal is blocked. Key add/remove is out of
 * scope here — this operates on values within the set's existing keys.
 *
 * @internal
 */
export function planVariantSetEdit(input: {
  setReference: VariantSetReference
  children: SystemVariant[]
  documentCountById: Record<string, number | null | undefined>
  edits: DimensionEdit[]
}): VariantSetEditPlan {
  const {setReference, children, documentCountById, edits} = input
  const original = reconstructVariantSetDimensions(children)
  const originalByKey = new Map(original.map((dimension) => [dimension.key, dimension.values]))

  const renamesByKey = new Map<string, Map<string, string>>()
  const removedByKey = new Map<string, Set<string>>()
  const addedByKey = new Map<string, string[]>()
  const newValuesByKey = new Map<string, string[]>()
  const renameConflicts: VariantSetEditPlan['renameConflicts'] = []

  for (const edit of edits) {
    const survivingOriginals = new Set<string>()
    const renames = new Map<string, string>()
    const added: string[] = []
    const resultingValues: string[] = []

    for (const {originalValue, value} of edit.values) {
      const trimmed = value.trim()
      if (originalValue !== null) {
        // An empty current value on an existing entry means "remove it".
        if (trimmed) {
          survivingOriginals.add(originalValue)
          if (trimmed !== originalValue) {
            renames.set(originalValue, trimmed)
          }
          resultingValues.push(trimmed)
        }
      } else if (trimmed) {
        added.push(trimmed)
        resultingValues.push(trimmed)
      }
    }

    // A rename whose target already exists on this key would merge two combinations; skip it and
    // report the conflict rather than silently collapsing definitions (and their documents).
    const resultingSet = new Set<string>()
    const dedupedResulting: string[] = []
    for (const value of resultingValues) {
      if (resultingSet.has(value)) {
        for (const [from, to] of renames) {
          if (to === value) {
            renameConflicts.push({key: edit.key, from, to})
            renames.delete(from)
          }
        }
      } else {
        resultingSet.add(value)
        dedupedResulting.push(value)
      }
    }

    const originalValues = originalByKey.get(edit.key) ?? []
    const removed = new Set(originalValues.filter((value) => !survivingOriginals.has(value)))

    renamesByKey.set(edit.key, renames)
    removedByKey.set(edit.key, removed)
    addedByKey.set(edit.key, added)
    newValuesByKey.set(edit.key, dedupedResulting)
  }

  const deletes: VariantSetEditPlan['deletes'] = []
  const blockedByValue = new Map<string, {id: string; title: string}[]>()
  const updates: EditableSystemVariant[] = []
  const survivingConditions: Record<string, string>[] = []

  for (const child of children) {
    // A child is removed if any of its condition values was removed on its key.
    let removedOnKey: {key: string; value: string} | null = null
    for (const [key, value] of Object.entries(child.conditions)) {
      if (removedByKey.get(key)?.has(value)) {
        removedOnKey = {key, value}
        break
      }
    }

    if (removedOnKey) {
      const count = documentCountById[child._id]
      const entry = {id: child._id, title: child.metadata?.title ?? child._id}
      if (typeof count === 'number' && count > 0) {
        const key = `${removedOnKey.key}:${removedOnKey.value}`
        blockedByValue.set(key, [...(blockedByValue.get(key) ?? []), entry])
      } else {
        deletes.push(entry)
      }
      continue
    }

    // Apply renames to the surviving child.
    const nextConditions: Record<string, string> = {}
    let changed = false
    for (const [key, value] of Object.entries(child.conditions)) {
      const renamed = renamesByKey.get(key)?.get(value)
      nextConditions[key] = renamed ?? value
      if (renamed && renamed !== value) {
        changed = true
      }
    }
    survivingConditions.push(nextConditions)

    if (changed) {
      updates.push({
        _id: child._id,
        _type: child._type,
        conditions: nextConditions,
        priority: child.priority,
        metadata: {...child.metadata, title: titleFor(setReference.name, nextConditions)},
      })
    }
  }

  // Blocked removals keep their value intact, so drop any deletes that belong to a blocked value.
  const blockedRemovals: VariantSetEditPlan['blockedRemovals'] = []
  const blockedValueKeys = new Set(blockedByValue.keys())
  for (const [composite, withDocuments] of blockedByValue) {
    const [key, ...rest] = composite.split(':')
    blockedRemovals.push({key: key!, value: rest.join(':'), withDocuments})
  }
  const safeDeletes = deletes.filter((entry) => {
    // Re-derive which value drove this delete to exclude blocked ones.
    const child = children.find((candidate) => candidate._id === entry.id)!
    for (const [key, value] of Object.entries(child.conditions)) {
      if (removedByKey.get(key)?.has(value) && blockedValueKeys.has(`${key}:${value}`)) {
        return false
      }
    }
    return true
  })

  // Existing combinations (post-rename, minus removed) used to dedupe new creations.
  const existingCombos = new Set(survivingConditions.map((conditions) => comboKey(conditions)))
  const creates: EditableSystemVariant[] = []
  const keys = Array.from(new Set(children.flatMap((child) => Object.keys(child.conditions))))

  for (const [addedKey, addedValues] of addedByKey) {
    for (const addedValue of addedValues) {
      const dimensions: VariantSetDimension[] = keys.map((key) =>
        key === addedKey
          ? {key, values: [addedValue]}
          : {key, values: newValuesByKey.get(key) ?? originalByKey.get(key) ?? []},
      )
      for (const conditions of generateVariantSetPermutations(dimensions)) {
        const key = comboKey(conditions)
        if (existingCombos.has(key)) {
          continue
        }
        existingCombos.add(key)
        creates.push({
          _id: createVariantId(),
          _type: 'system.variant',
          conditions,
          priority: 0,
          metadata: {
            title: titleFor(setReference.name, conditions),
            description: [],
            [VARIANT_SET_METADATA_KEY]: setReference,
          },
        })
      }
    }
  }

  return {updates, creates, deletes: safeDeletes, blockedRemovals, renameConflicts}
}

function comboKey(conditions: Record<string, string>): string {
  return Object.keys(conditions)
    .sort()
    .map((key) => `${key}=${conditions[key]}`)
    .join('&')
}
