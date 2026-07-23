import {isKeySegment, type Path, type PathSegment} from '@sanity/types'

/**
 * Standalone table field POC — pure helpers.
 *
 * The disguise: a `standaloneTableObject` field (rows > row > cells > cell >
 * value[]) is edited through a *real* Portable Text editor. To do that we
 * "package" the whole table object as a single Portable Text block — a
 * container node keyed with a stable, well-known key (`ROOT_KEY`) — so the
 * editor sees an ordinary one-block PT value it knows how to render and mutate
 * via `defineContainer`.
 *
 * When the editor emits patches, their paths are rooted at that synthetic block
 * (`[{_key: 'root'}, 'rows', …]`). Before handing them back to the Studio form
 * we strip that leading segment so the patch targets the real object field
 * (`['rows', …]`). That re-rooting is the whole trick, and it is what these
 * helpers exist to make correct and testable.
 */

/** Well-known type of the single synthetic container block. */
export const TABLE_TYPE = 'standaloneTableObject'

/**
 * Stable `_key` of the synthetic root block. It never changes across the
 * lifetime of a field, so re-rooting can rely on it and the editor never sees
 * the key churn (which would remount the block and lose selection).
 */
export const ROOT_KEY = 'root'

export interface TableCell {
  _key: string
  _type: 'cell'
  value?: unknown[]
}

export interface TableRow {
  _key: string
  _type: 'row'
  cells?: TableCell[]
}

/** The real field value stored on the document. */
export interface StandaloneTableValue {
  _type: typeof TABLE_TYPE
  rows?: TableRow[]
}

/**
 * A synthetic Portable Text block wrapping the table object. It is the table
 * object verbatim, plus the stable `_key`. Kept structurally loose because the
 * editor round-trips arbitrary nested content through it.
 */
export interface RootBlock {
  _key: string
  _type: typeof TABLE_TYPE
  rows: TableRow[]
  [key: string]: unknown
}

/**
 * Wrap the real field value as a one-block Portable Text value the editor can
 * render. Always returns exactly one block keyed `ROOT_KEY`; a missing/empty
 * value becomes a root block with no rows (the input's scaffold behavior fills
 * it in). Any incoming `_key`/`_type` on the value is overwritten so the
 * synthetic block is always well-formed.
 */
export function packageTableValue(value: StandaloneTableValue | undefined): RootBlock[] {
  const {_key, _type, rows, ...rest} = (value ?? {}) as Partial<RootBlock>
  return [
    {
      ...rest,
      _key: ROOT_KEY,
      _type: TABLE_TYPE,
      rows: Array.isArray(rows) ? rows : [],
    },
  ]
}

/**
 * Reverse of {@link packageTableValue}: pull the real field value back out of
 * the editor's one-block value. Returns `undefined` when there is no usable
 * root block, so an emptied editor maps to an absent field rather than a husk.
 */
export function unpackageTableValue(
  blocks: readonly unknown[] | undefined,
): StandaloneTableValue | undefined {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return undefined
  }
  // Prefer the stably-keyed root; fall back to the first block so a value that
  // lost its key (e.g. an old draft) still unpacks.
  const root =
    (blocks.find(
      (block): block is RootBlock =>
        typeof block === 'object' && block !== null && (block as RootBlock)._key === ROOT_KEY,
    ) as RootBlock | undefined) ?? (blocks[0] as RootBlock | undefined)

  if (!root || typeof root !== 'object') {
    return undefined
  }

  const {_key, _type, rows, ...rest} = root
  return {
    ...rest,
    _type: TABLE_TYPE,
    rows: Array.isArray(rows) ? rows : [],
  }
}

/**
 * True when a path begins at the synthetic root block, i.e. it is a patch the
 * editor produced for our packaged value and can be safely re-rooted.
 */
export function isRootedPath(path: Path, rootKey: string = ROOT_KEY): boolean {
  const [head] = path
  return head !== undefined && isKeySegment(head) && head._key === rootKey
}

/**
 * Strip the leading `{_key: 'root'}` segment so a patch targeting the synthetic
 * block instead targets the real object field. Returns `null` for any path not
 * rooted at the synthetic block (e.g. a whole-array `set` with an empty path,
 * or a patch aimed at a different key) — the caller drops those and warns,
 * because forwarding them would corrupt sibling fields or clobber the value.
 */
export function rerootPath(path: Path, rootKey: string = ROOT_KEY): Path | null {
  if (!isRootedPath(path, rootKey)) {
    return null
  }
  return path.slice(1)
}

/** A minimal structural view of a Sanity patch: enough to re-root it. */
export interface PathedPatch {
  path: Path
  type?: string
  [key: string]: unknown
}

/**
 * Re-root a single patch, or return `null` if it is not anchored at the
 * synthetic root block. The returned patch is a shallow copy with its `path`
 * rewritten; every other field (value, position, etc.) is preserved so the
 * granular set/unset/insert/diffMatchPatch semantics survive untouched.
 */
export function rerootPatch<T extends PathedPatch>(patch: T, rootKey: string = ROOT_KEY): T | null {
  const path = rerootPath(patch.path, rootKey)
  if (path === null) {
    return null
  }
  return {...patch, path}
}

/**
 * Re-root a batch of patches, dropping any that are not rooted at the synthetic
 * block and warning once per dropped patch. This is the guard that keeps a
 * stray whole-value `set()` from ever reaching the real field path.
 */
export function rerootPatches<T extends PathedPatch>(
  patches: readonly T[],
  rootKey: string = ROOT_KEY,
): T[] {
  const out: T[] = []
  for (const patch of patches) {
    const rerooted = rerootPatch(patch, rootKey)
    if (rerooted === null) {
      console.warn(
        `[standaloneTable] dropped patch not rooted at {_key: ${JSON.stringify(rootKey)}}:`,
        describePathForWarning(patch.path),
      )
      continue
    }
    out.push(rerooted)
  }
  return out
}

function describePathForWarning(path: Path): string {
  return `[${path.map(describeSegment).join(', ')}]`
}

function describeSegment(segment: PathSegment): string {
  if (isKeySegment(segment)) {
    return `{_key: ${JSON.stringify(segment._key)}}`
  }
  return JSON.stringify(segment)
}
