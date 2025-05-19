/* eslint-disable no-negated-condition */
import {useEditor} from '@portabletext/editor'
import {defineBehavior, execute} from '@portabletext/editor/behaviors'
import {useEffect} from 'react'
import {definePlugin, isArrayOfBlocksSchemaType} from 'sanity'
import {Text} from '@sanity/ui'
/**
 * This Studio Plugin shows how to:
 *
 * 1. Define a standalone and portable Behavior using `defineBehavior`
 * 2. Register the Behavior using `editor.registerBehavior` inside a PTE React Plugin
 * 3. Render the Plugin inside Studio using `renderPlugins`
 */

/**
 * This Behavior will auto-close brackets when the user inserts an opening
 * bracket. It will also move the cursor in between the brackets so the user
 * can start typing immediately.
 */
const autoCloseBracketsBehavior = defineBehavior({
  on: 'insert.text',
  guard: ({event}) => {
    const bracketPairs: Record<string, string | undefined> = {
      '(': ')',
      '[': ']',
      '{': '}',
    }
    const lastInsertedChar = event.text.at(-1)
    const closingBracket =
      lastInsertedChar !== undefined ? bracketPairs[lastInsertedChar] : undefined

    if (closingBracket !== undefined) {
      // Passing the closing bracket to the actions for reuse
      return {closingBracket}
    }

    return false
  },
  actions: [
    ({event}) => [
      // Execute the original event that includes the opening bracket
      execute(event),
    ],
    /*
     * New undo step so the auto-closing of the bracket can be undone.
     * Notice how the step reuses the `closingBracket` derived in the `guard`.
     */
    (_, {closingBracket}) => [
      // Execute a new `insert.text` event with a closing bracket
      execute({
        type: 'insert.text',
        text: closingBracket,
      }),
      // Execute a `move.backward` event to move the cursor in between the brackets
      execute({
        type: 'move.backward',
        distance: closingBracket.length,
      }),
    ],
  ],
})

/**
 * This PTE Plugin will register the auto-close brackets Behavior inside PTE.
 */
function AutoCloseBracketsBehaviorPlugin() {
  const editor = useEditor()

  useEffect(() => {
    const unregisterBehavior = editor.registerBehavior({
      behavior: autoCloseBracketsBehavior,
    })

    return () => {
      unregisterBehavior()
    }
  }, [editor])

  return <Text size={0}>Auto close brackets</Text>
}

/**
 * This Studio Plugin will add the auto-close brackets Behavior to all PTE
 * inputs inside Studio.
 */
export const autoCloseBrackets = definePlugin({
  name: 'auto-close brackets',
  form: {
    components: {
      input: (props) => {
        if (!isArrayOfBlocksSchemaType(props.schemaType)) {
          return props.renderDefault(props)
        }

        return props.renderDefault({
          ...props,
          renderPlugins: (pluginProps) => {
            return (
              <>
                {props.renderPlugins?.(pluginProps)}
                <AutoCloseBracketsBehaviorPlugin />
              </>
            )
          },
        })
      },
    },
  },
})
