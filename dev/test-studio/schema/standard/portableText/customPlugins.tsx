/* eslint-disable react/jsx-no-bind */
import {defineBehavior, effect, forward} from '@portabletext/editor/behaviors'
import {BehaviorPlugin, DecoratorShortcutPlugin, OneLinePlugin} from '@portabletext/editor/plugins'
import {defineType} from 'sanity'

export const customPlugins = defineType({
  name: 'customPlugins',
  title: 'Custom Plugins',
  type: 'document',
  fields: [
    {
      type: 'string',
      name: 'title',
    },

    /**
     * One-Line Editor
     *
     * Uses the `OneLinePlugin` to restrict the editor to one line of text.
     */
    {
      type: 'array',
      name: 'oneLineEditor',
      title: 'One-Line Editor',
      description: 'The editor is restricted to one line of text using the <OneLinePlugin />',
      of: [
        {
          type: 'block',
        },
      ],
      components: {
        pte: {
          plugins: (props) => {
            return (
              <>
                {props.renderDefault(props)}
                <OneLinePlugin />
              </>
            )
          },
        },
      },
    },

    /**
     * Custom Markdown Config
     *
     * Uses `renderMarkdownPlugin` to reconfigure the `MarkdownPlugin`.
     */
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
        pte: {
          plugins: (props) => {
            return props.renderDefault({
              ...props,
              markdownPluginProps: {
                config: {
                  boldDecorator: ({schema}) =>
                    schema.decorators.find((decorator) => decorator.value === 'bold')?.value,
                },
              },
            })
          },
        },
      },
    },

    /**
     * Custom Decorator Shortcuts
     *
     * Uses the `DecoratorShortcutPlugin` add custom decorator shortcuts in the
     * editor.
     */
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
        pte: {
          plugins: (props) => {
            return (
              <>
                {props.renderDefault({
                  ...props,
                  markdownPluginProps: {
                    config: {
                      ...props.markdownPluginProps.config,
                      boldDecorator: undefined,
                      italicDecorator: undefined,
                    },
                  },
                })}
                <DecoratorShortcutPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.name === 'strong')?.name
                  }
                  pair={{
                    char: '👻',
                    amount: 2,
                  }}
                />
                <DecoratorShortcutPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.name === 'strong')?.name
                  }
                  pair={{
                    char: '🕹️',
                    amount: 2,
                  }}
                />
                <DecoratorShortcutPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.name === 'em')?.name
                  }
                  pair={{
                    char: '👻',
                    amount: 1,
                  }}
                />
                <DecoratorShortcutPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.name === 'em')?.name
                  }
                  pair={{
                    char: '🕹️',
                    amount: 1,
                  }}
                />
              </>
            )
          },
        },
      },
    },

    /**
     * No Plugins
     *
     * Removes all plugins from the editor.
     */
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
        pte: {
          plugins: (props) => {
            return null
          },
        },
      },
    },

    /**
     * Custom Behavior
     *
     * Uses the `BehaviorPlugin` to add a custom behavior to the editor
     * without much boilerplate.
     */
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
        pte: {
          plugins: (props) => {
            return (
              <>
                {props.renderDefault(props)}
                <BehaviorPlugin
                  behaviors={[
                    defineBehavior({
                      on: 'insert.text',
                      actions: [
                        ({event}) => [
                          effect(() => {
                            // eslint-disable-next-line no-console
                            console.log(event)
                          }),
                          forward(event),
                        ],
                      ],
                    }),
                  ]}
                />
              </>
            )
          },
        },
      },
    },
  ],
})
