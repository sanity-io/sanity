/* eslint-disable no-negated-condition */
import {useEditor} from '@portabletext/editor'
import {defineBehavior, execute} from '@portabletext/editor/behaviors'
import {Text} from '@sanity/ui'
import {useEffect} from 'react'
import {definePlugin} from 'sanity'

/**
 * This Studio Plugin shows how to:
 *
 * 1. Define a standalone and portable Behavior using `defineBehavior`
 * 2. Register the Behavior using `editor.registerBehavior` inside a PTE React Plugin
 * 3. Render the Plugin inside Studio using `renderPlugins`
 */

/**
 * This Behavior will replace '👋' with 'Hello, world!' when the user inserts
 * '👋'.
 */
const waveBehavior = defineBehavior({
  on: 'insert.text',
  guard: ({event}) => event.text === '👋',
  actions: [
    ({event}) => [
      // Execute the original event that inserts '👋'
      execute(event),
    ],
    /* Replace the '👋' with 'Hello, world!' in a separate undo step so the
     * Behavior can be undone.
     */
    () => [
      // Delete the '👋'
      execute({type: 'delete.backward', unit: 'character'}),
      // And insert 'Hello, world!'
      execute({type: 'insert.text', text: 'Hello, world!'}),
    ],
  ],
})

/**
 * This PTE Plugin will register the wave Behavior inside PTE.
 */
function WaveBehaviorPlugin() {
  const editor = useEditor()

  useEffect(() => {
    const unregisterBehavior = editor.registerBehavior({
      behavior: waveBehavior,
    })

    return () => {
      unregisterBehavior()
    }
  }, [editor])

  return <Text size={0}>Wave plugin</Text>
}

/**
 * This Studio Plugin will add the wave Behavior to all PTE inputs inside Studio.
 */
export const wave = definePlugin({
  name: 'wave',
  form: {
    components: {
      pte: {
        plugins: (props) => {
          return (
            <>
              {props.renderDefault(props)}
              <WaveBehaviorPlugin />
            </>
          )
        },
      },
    },
  },
})
