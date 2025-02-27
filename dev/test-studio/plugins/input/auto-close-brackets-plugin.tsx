import {defineBehavior, execute} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import * as selectors from '@portabletext/editor/selectors'
import {definePlugin, isArrayOfBlocksSchemaType} from 'sanity'

export const autoCloseBrackets = definePlugin({
  name: 'auto-close brackets',
  form: {
    components: {
      input: (props) => {
        if (!isArrayOfBlocksSchemaType(props.schemaType)) {
          return props.renderDefault(props)
        }

        // Add auto-close brackets Behavior to all PTE inputs
        return props.renderDefault({
          ...props,
          renderPlugins: (pluginProps) => {
            return (
              <>
                {pluginProps.renderDefault(pluginProps)}
                <BehaviorPlugin behaviors={[autoCloseBracketsBehavior]} />
              </>
            )
          },
        })
      },
    },
  },
})

const autoCloseBracketsBehavior = defineBehavior({
  on: 'insert.text',
  guard: ({snapshot, event}) => {
    const bracketPairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
    }
    const lastInsertedChar = event.text.at(-1)
    const selection =
      snapshot.context.selection && selectors.isSelectionCollapsed(snapshot)
        ? snapshot.context.selection
        : null
    // eslint-disable-next-line no-negated-condition
    const closingBracket = lastInsertedChar !== undefined ? bracketPairs[event.text] : undefined

    if (!selection || closingBracket === undefined) {
      return false
    }

    return {selection, closingBracket}
  },
  actions: [
    ({event}, {selection, closingBracket}) => [
      // Execute the original event that includes the opening bracket
      execute(event),
      // Execute a new insert.text event with a closing bracket
      execute({
        type: 'insert.text',
        text: closingBracket,
      }),
      // Execute a select event to move the cursor in between the brackets
      // Note that this select event can be brittle because it assumes that the
      // bracket was inserted in the span of the original event, which is not always the case
      // TODO: Replace with `move.backward` when that Abstract Event is available
      execute({
        type: 'select',
        at: {
          anchor: {
            path: selection.anchor.path,
            offset: selection.anchor.offset + event.text.length,
          },
          focus: {
            path: selection.focus.path,
            offset: selection.focus.offset + event.text.length,
          },
        },
      }),
    ],
  ],
})
