import {type EditorSelector, useEditor, useEditorSelector} from '@portabletext/editor'
import {getFocusBlock} from '@portabletext/editor/selectors'
import {getSanitySubSchema, type PortableTextMemberSchemaTypes} from '@portabletext/sanity-bridge'
import {type ObjectSchemaType, type Path} from '@sanity/types'
import {isEqual as isEqualPath} from '@sanity/util/paths'
import {useMemo} from 'react'

import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'

/**
 * The member schema types the toolbar renders controls for: the root
 * field's own members, plus the members declared by the block config at
 * the focus position that the root field does not declare.
 *
 * A container child can declare an independent block config - a table
 * cell allowing `number` lists the root field omits, say. Sourcing
 * membership from the root field alone makes such a config a pure
 * restriction, since `useApplicableSchema` can only disable what is
 * already rendered. The union keeps the root's members in place (still
 * rendered, disabled, wherever the position doesn't declare them) while
 * surfacing the position's own additions.
 *
 * @internal
 */
export function useToolbarSchemaTypes(): PortableTextMemberSchemaTypes {
  const rootSchemaTypes = usePortableTextMemberSchemaTypes()
  const editor = useEditor()
  // The sub-schema only changes when the focus moves to a block under a
  // different container, so hold the resolution to the focus block's
  // path instead of re-running it on every editor tick.
  const focusBlockPath = useEditorSelector(editor, selectFocusBlockPath, isSamePath)

  return useMemo(() => {
    if (!focusBlockPath) {
      return rootSchemaTypes
    }
    return mergeSchemaTypes(
      rootSchemaTypes,
      // A block object at the root resolves to the root sub-schema, so
      // a void focus needs no special handling here.
      getSanitySubSchema(
        rootSchemaTypes.portableText,
        editor.getSnapshot().context.value,
        focusBlockPath,
      ),
    )
  }, [editor, focusBlockPath, rootSchemaTypes])
}

const selectFocusBlockPath: EditorSelector<Path | undefined> = (snapshot) =>
  getFocusBlock(snapshot)?.path

function isSamePath(a: Path | undefined, b: Path | undefined): boolean {
  return a === undefined || b === undefined ? a === b : isEqualPath(a, b)
}

const byValue = (entry: {value: string}) => entry.value
const byName = (entry: ObjectSchemaType) => entry.name

/**
 * `positional` contributes only what `root` lacks, appended after it, so
 * the controls the root field declares keep their order and position as
 * the caret moves. `block`, `span` and `portableText` stay at their root
 * values: they identify the field itself rather than a set of members.
 */
function mergeSchemaTypes(
  root: PortableTextMemberSchemaTypes,
  positional: PortableTextMemberSchemaTypes,
): PortableTextMemberSchemaTypes {
  const merged: PortableTextMemberSchemaTypes = {
    ...root,
    annotations: appendMissing(root.annotations, positional.annotations, byName),
    blockObjects: appendMissing(root.blockObjects, positional.blockObjects, byName),
    decorators: appendMissing(root.decorators, positional.decorators, byValue),
    inlineObjects: appendMissing(root.inlineObjects, positional.inlineObjects, byName),
    lists: appendMissing(root.lists, positional.lists, byValue),
    styles: appendMissing(root.styles, positional.styles, byValue),
  }

  // Every memo downstream keys off this object, and the common case is a
  // position that adds nothing.
  return merged.annotations === root.annotations &&
    merged.blockObjects === root.blockObjects &&
    merged.decorators === root.decorators &&
    merged.inlineObjects === root.inlineObjects &&
    merged.lists === root.lists &&
    merged.styles === root.styles
    ? root
    : merged
}

function appendMissing<TEntry>(
  base: TEntry[],
  extra: TEntry[],
  identity: (entry: TEntry) => string,
): TEntry[] {
  const present = new Set(base.map(identity))
  const missing = extra.filter((entry) => !present.has(identity(entry)))
  return missing.length === 0 ? base : base.concat(missing)
}
