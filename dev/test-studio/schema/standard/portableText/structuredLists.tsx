import {defineContainer} from '@portabletext/editor'
import {defineBehavior, raise} from '@portabletext/editor/behaviors'
import {BehaviorPlugin, NodePlugin} from '@portabletext/editor/plugins'
import {getFocusTextBlock, getNextBlock, getPreviousBlock} from '@portabletext/editor/selectors'
import {defineInputRule, defineInputRuleBehavior} from '@portabletext/plugin-input-rule'
import {type PortableTextPluginsProps, useFormValue} from 'sanity'

/**
 * Structured lists: container renders plus markdown-style input rules for
 * the `list` → `items` → `list-item` → `content` shape. Editing niceties
 * beyond conversion (Tab to nest, Enter to split, merges) are out of
 * scope here.
 */
export function StructuredListsPlugins(props: PortableTextPluginsProps) {
  // Flips the same document between inline container rendering and
  // dialog-edited block objects; see the `containersEnabled` field
  // description.
  const containersEnabled = useFormValue(['containersEnabled']) !== false

  return (
    <>
      {props.renderDefault(props)}
      {containersEnabled ? (
        <>
          <NodePlugin nodes={nodes} />
          <BehaviorPlugin behaviors={behaviors} />
        </>
      ) : null}
    </>
  )
}

// `NodePlugin` re-registers when the array identity changes, so the nodes
// live at module level.
const nodes = [
  defineContainer({
    type: 'list',
    arrayField: 'items',
    render: ({children, attributes, node}) =>
      node.kind === 'number' ? (
        // `marginBlock` rather than `margin` so the studio's own
        // `margin: 0 auto` centering survives.
        <ol {...attributes} style={{marginBlock: 0, paddingLeft: 24}}>
          {children}
        </ol>
      ) : (
        <ul {...attributes} style={{marginBlock: 0, paddingLeft: 24}}>
          {children}
        </ul>
      ),
    of: [
      // A nested list in an item's content resolves to the global `list`
      // registration, so the recursion needs no cycle here.
      defineContainer({
        type: 'list-item',
        arrayField: 'content',
        render: ({children, attributes}) => <li {...attributes}>{children}</li>,
      }),
    ],
  }),
]

/**
 * Typing a list marker at the start of a block converts the block: the
 * marker is deleted and the block lifts into the new list's first item,
 * the way markdown editors convert. Inside a list item's content this
 * nests a list, the schema's recursion allows it at any depth.
 */
function listInputRule(kind: 'bullet' | 'number', on: RegExp) {
  return defineInputRule({
    on,
    actions: [
      // Action callbacks see the document as it was before the
      // insertion, so they only raise events with statically known
      // payloads; `match.targetOffsets` address the text the raised
      // events apply to.
      ({event}) => {
        const match = event.matches.at(0)
        if (!match) {
          return []
        }
        return [
          raise({type: 'delete', at: match.targetOffsets}),
          raise({type: 'custom.convert to list', kind}),
        ]
      },
    ],
  })
}

// Raised events perform against live state, so this behavior sees the
// block after the marker delete has applied.
const convertToList = defineBehavior<
  {kind: 'bullet' | 'number'},
  'custom.convert to list',
  {
    focusBlock: NonNullable<ReturnType<typeof getFocusTextBlock>>
    placement: 'before' | 'after' | 'auto'
    at: ReturnType<typeof getPreviousBlock>
  }
>({
  on: 'custom.convert to list',
  guard: ({snapshot}) => {
    const focusBlock = getFocusTextBlock(snapshot)
    if (!focusBlock) {
      return false
    }
    // After the `delete.block` below, the selection no longer describes
    // the deleted block's position, so `placement: 'auto'` cannot be
    // trusted to keep the list where the block was. Anchor the insert to
    // a live sibling instead; `auto` remains only for a block that is
    // alone in its array.
    const previousBlock = getPreviousBlock(snapshot)
    const nextBlock = getNextBlock(snapshot)
    return {
      focusBlock,
      placement: previousBlock ? 'after' : nextBlock ? 'before' : 'auto',
      at: previousBlock ?? nextBlock,
    }
  },
  actions: [
    ({event}, {focusBlock, placement, at}) => [
      raise({type: 'delete.block', at: focusBlock.path}),
      raise({
        type: 'insert.block',
        block: {
          _type: 'list',
          kind: event.kind,
          items: [{_type: 'list-item', content: [focusBlock.node]}],
        },
        placement,
        at: at
          ? {
              anchor: {path: at.path, offset: 0},
              focus: {path: at.path, offset: 0},
            }
          : undefined,
        select: 'start',
      }),
    ],
  ],
})

const behaviors = [
  convertToList,
  defineInputRuleBehavior({
    rules: [
      listInputRule('bullet', /^[-*] $/),
      // Any leading number works; markdown renumbers on render anyway.
      listInputRule('number', /^\d+\. $/),
    ],
  }),
]
