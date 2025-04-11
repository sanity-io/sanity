/* eslint-disable react/jsx-no-bind */
import {useEditor} from '@portabletext/editor'
import {defineBehavior} from '@portabletext/editor/behaviors'
import {BehaviorPlugin, DecoratorShortcutPlugin, OneLinePlugin} from '@portabletext/editor/plugins'
import * as selectors from '@portabletext/editor/selectors'
import {useEffect} from 'react'
import {defineType, type PortableTextInputProps} from 'sanity'

export const customPlugins = defineType({
  name: 'customPlugins',
  title: 'Custom Plugins',
  type: 'document',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'array',
      name: 'oneLineEditor',
      title: 'One Line Editor',
      description: 'The editor is restricted to one line of text using the <OneLinePlugin />',
      of: [
        {
          type: 'block',
        },
      ],
      components: {
        input: (props: PortableTextInputProps) => {
          return props.renderDefault({
            ...props,
            renderPlugins: (pluginProps) => {
              return (
                <>
                  {pluginProps.renderDefault(pluginProps)}
                  <OneLinePlugin />
                </>
              )
            },
          })
        },
      },
    },
    {
      type: 'array',
      name: 'customMarkdownConfig',
      title: 'Custom Markdown Config',
      description:
        'Only a "bold" decorator is allowed and the <MarkdownPlugin /> has been reconfigured to support this',
      of: [
        {
          type: 'block',
          marks: {
            decorators: [
              {
                value: 'bold',
                title: 'Bold',
                component: ({children}) => <strong>{children}</strong>,
              },
            ],
          },
        },
      ],
      components: {
        input: (props: PortableTextInputProps) => {
          return props.renderDefault({
            ...props,
            renderPlugins: (pluginProps) => (
              <>
                {pluginProps.renderDefault({
                  ...pluginProps,
                  renderMarkdownPlugin: (markdownPluginProps) => {
                    return markdownPluginProps.renderDefault({
                      config: {
                        ...markdownPluginProps.config,
                        boldDecorator: ({schema}) =>
                          schema.decorators.find((decorator) => decorator.value === 'bold')?.value,
                      },
                    })
                  },
                })}
              </>
            ),
          })
        },
      },
    },
    {
      type: 'array',
      name: 'customDecoratorShortcuts',
      title: 'Custom Decorator Shortcuts',
      description: 'The markdown shortcuts for bold and italic have been replaced with 👻 and 🕹️',
      of: [
        {
          type: 'block',
        },
      ],
      components: {
        input: (props: PortableTextInputProps) => {
          return props.renderDefault({
            ...props,
            renderPlugins: (pluginProps) => (
              <>
                <DecoratorShortcutPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.value === 'strong')?.value
                  }
                  pair={{
                    char: '👻',
                    amount: 2,
                  }}
                />
                <DecoratorShortcutPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.value === 'strong')?.value
                  }
                  pair={{
                    char: '🕹️',
                    amount: 2,
                  }}
                />
                <DecoratorShortcutPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.value === 'em')?.value
                  }
                  pair={{
                    char: '👻',
                    amount: 1,
                  }}
                />
                <DecoratorShortcutPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.value === 'em')?.value
                  }
                  pair={{
                    char: '🕹️',
                    amount: 1,
                  }}
                />
                {pluginProps.renderDefault({
                  ...pluginProps,
                  renderMarkdownPlugin: (markdownPluginProps) => {
                    return markdownPluginProps.renderDefault({
                      config: {
                        ...markdownPluginProps.config,
                        boldDecorator: undefined,
                        italicDecorator: undefined,
                      },
                    })
                  },
                })}
              </>
            ),
          })
        },
      },
    },
    {
      type: 'array',
      name: 'noPlugins',
      title: 'No Plugins',
      description: 'All plugins are removed, even the default ones',
      of: [
        {
          type: 'block',
        },
      ],
      components: {
        input: (props: PortableTextInputProps) => {
          return props.renderDefault({
            ...props,
            renderPlugins: () => <></>,
          })
        },
      },
    },
    {
      type: 'array',
      name: 'customBehavior',
      title: 'Custom Behavior',
      description: 'Custom "log text insertions" Behavior using the <BehaviorPlugin />',
      of: [
        {
          type: 'block',
        },
      ],
      components: {
        input: (props: PortableTextInputProps) => {
          return props.renderDefault({
            ...props,
            renderPlugins: (pluginProps) => (
              <>
                <BehaviorPlugin
                  behaviors={[
                    defineBehavior({
                      on: 'insert.text',
                      actions: [
                        ({event}) => [
                          {
                            type: 'effect',
                            effect: () => {
                              // eslint-disable-next-line no-console
                              console.log(event)
                            },
                          },
                        ],
                      ],
                    }),
                  ]}
                />
                {pluginProps.renderDefault(pluginProps)}
              </>
            ),
          })
        },
      },
    },
    {
      type: 'array',
      name: 'customPlugin',
      title: 'Custom Plugin',
      description: 'Custom <AutoCloseBracketsPlugin /> that automatically closes "(", "[", and "{"',
      of: [{type: 'block'}],
      components: {
        input: (props: PortableTextInputProps) => {
          return props.renderDefault({
            ...props,
            renderPlugins: (pluginProps) => {
              return (
                <>
                  <AutoCloseBracketsPlugin />
                  {pluginProps.renderDefault(pluginProps)}
                </>
              )
            },
          })
        },
      },
    },
  ],
})

function AutoCloseBracketsPlugin() {
  const editor = useEditor()

  useEffect(() => {
    return editor.registerBehavior({
      behavior: autoCloseBracketsBehavior,
    })
  }, [editor])

  return null
}

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
      // Send the original event that includes the opening bracket
      event,
      // Send a new insert.text event with a closing bracket
      {
        type: 'insert.text',
        text: closingBracket,
      },
      // Send a select event to move the cursor in between the brackets
      // Note that this select event can be brittle because it assumes that the
      // bracket was inserted in the span of the original event, which is not always the case
      {
        type: 'select',
        selection: {
          anchor: {
            path: selection.anchor.path,
            offset: selection.anchor.offset + event.text.length,
          },
          focus: {
            path: selection.focus.path,
            offset: selection.focus.offset + event.text.length,
          },
        },
      },
    ],
  ],
})
