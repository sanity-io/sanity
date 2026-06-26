import {defineBehavior, effect, forward} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {CharacterPairDecoratorPlugin} from '@portabletext/plugin-character-pair-decorator'
import {defineArrayMember, defineType} from 'sanity'

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
     * Focus Test (custom highlight) -- MAIN render pipeline, no clean break
     */
    {
      type: 'array',
      name: 'focusTest',
      title: 'Focus Test (custom style/list component)',
      description:
        'With the caret in the editor, toggle the Highlight style or the Arrow list; checking whether a consumer `component` override drops editor focus.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {value: 'normal', title: 'Normal'},
            {
              value: 'highlight',
              title: 'Highlight',
              component: ({children}) => (
                <span style={{backgroundColor: 'yellow', padding: '0 0.2em'}}>{children}</span>
              ),
            },
          ],
          lists: [
            {
              value: 'arrow',
              title: 'Arrow',
              component: ({children}) => (
                <span>
                  {'\u2794 '}
                  {children}
                </span>
              ),
            },
          ],
        }),
      ],
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
        defineArrayMember({
          type: 'block',
          options: {
            oneLine: true,
          },
        }),
      ],
    },

    /**
     * Custom Markdown Config
     *
     * Uses `components.portableText.plugins` to reconfigure the `MarkdownShortcutsPlugin`.
     */
    {
      type: 'array',
      name: 'customMarkdownConfig',
      title: 'Custom Markdown Config',
      description:
        'Only a "bold" decorator is allowed and the unordered list is called "dot", and the <MarkdownShortcutsPlugin /> has been reconfigured to support this',
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
          lists: [
            {
              value: 'dot',
              title: 'Dot',
            },
          ],
        },
      ],
      components: {
        portableText: {
          plugins: (props) => {
            return props.renderDefault({
              ...props,
              plugins: {
                ...props.plugins,
                markdown: {
                  boldDecorator: ({schema}) =>
                    schema.decorators.find((decorator) => decorator.name === 'bold')?.name,
                  unorderedList: ({schema}) =>
                    schema.lists.find((list) => list.name === 'dot')?.name,
                },
              },
            })
          },
        },
      },
    },

    /**
     * Custom Markdown Config (the deprecated way)
     *
     * Uses `components.portableText.plugins` to reconfigure the `MarkdownShortcutsPlugin`.
     */
    {
      type: 'array',
      name: 'customMarkdownConfigDeprecated',
      title: 'Custom Markdown Config (the deprecated way)',
      description:
        'Only a "bold" decorator is allowed and the unordered list is called "dot", and the <MarkdownShortcutsPlugin /> has been reconfigured to support this',
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
          lists: [
            {
              value: 'dot',
              title: 'Dot',
            },
          ],
        },
      ],
      components: {
        portableText: {
          plugins: (props) => {
            return props.renderDefault({
              ...props,
              plugins: {
                ...props.plugins,
                markdown: {
                  config: {
                    boldDecorator: ({schema}) =>
                      schema.decorators.find((decorator) => decorator.name === 'bold')?.name,
                    unorderedListStyle: ({schema}) =>
                      schema.lists.find((list) => list.name === 'dot')?.name,
                  },
                },
              },
            })
          },
        },
      },
    },

    /**
     * Markdown Shortcuts Disabled
     */
    {
      type: 'array',
      name: 'markdownShortcutsDisabled',
      title: 'Markdown Shortcuts Disabled',
      description: 'The markdown shortcuts are disabled',
      of: [
        {
          type: 'block',
        },
      ],
      components: {
        portableText: {
          plugins: (props) => {
            return props.renderDefault({
              ...props,
              plugins: {
                ...props.plugins,
                markdown: {
                  enabled: false,
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
     * Uses the `CharacterPairDecoratorPlugin` add custom decorator shortcuts in the
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
        portableText: {
          plugins: (props) => {
            return (
              <>
                {props.renderDefault({
                  ...props,
                  plugins: {
                    ...props.plugins,
                    markdown: {
                      config: {
                        ...props.plugins.markdown,
                        boldDecorator: undefined,
                        italicDecorator: undefined,
                      },
                    },
                  },
                })}
                <CharacterPairDecoratorPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.name === 'strong')?.name
                  }
                  pair={{
                    char: '👻',
                    amount: 2,
                  }}
                />
                <CharacterPairDecoratorPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.name === 'strong')?.name
                  }
                  pair={{
                    char: '🕹️',
                    amount: 2,
                  }}
                />
                <CharacterPairDecoratorPlugin
                  decorator={({schema}) =>
                    schema.decorators.find((decorator) => decorator.name === 'em')?.name
                  }
                  pair={{
                    char: '👻',
                    amount: 1,
                  }}
                />
                <CharacterPairDecoratorPlugin
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
     * All Typographic rules enabled
     */
    {
      type: 'array',
      name: 'allTypographicRulesEnabled',
      title: 'All Typographic Rules Enabled',
      description: 'All typographic rules are enabled',
      of: [
        {
          type: 'block',
        },
      ],
      components: {
        portableText: {
          plugins: (props) => {
            return props.renderDefault({
              ...props,
              plugins: {
                ...props.plugins,
                typography: {
                  ...props.plugins.typography,
                  preset: 'all',
                },
              },
            })
          },
        },
      },
    },

    /**
     * No Typographic rules enabled
     */
    {
      type: 'array',
      name: 'noTypographicRulesEnabled',
      title: 'No Typographic Rules Enabled',
      description: 'No typographic rules are enabled',
      of: [
        {
          type: 'block',
        },
      ],
      components: {
        portableText: {
          plugins: (props) => {
            return props.renderDefault({
              ...props,
              plugins: {
                ...props.plugins,
                typography: {
                  enabled: false,
                },
              },
            })
          },
        },
      },
    },

    /**
     * Paste Link Disabled
     *
     * Disables the default behavior of converting selected text into a link
     * when a URL is pasted.
     */
    {
      type: 'array',
      name: 'pasteLinkDisabled',
      title: 'Paste Link Disabled',
      description:
        'The paste link behavior is disabled - pasting a URL on selected text will replace the text',
      of: [
        {
          type: 'block',
        },
      ],
      components: {
        portableText: {
          plugins: (props) => {
            return props.renderDefault({
              ...props,
              plugins: {
                ...props.plugins,
                pasteLink: {
                  enabled: false,
                },
              },
            })
          },
        },
      },
    },

    /**
     * Custom Paste Link Annotation
     *
     * Uses a custom link matcher to support a different annotation type
     * for links (e.g., 'customLink' instead of 'link').
     */
    {
      type: 'array',
      name: 'customPasteLinkAnnotation',
      title: 'Custom Paste Link Annotation',
      description:
        'The paste link behavior uses a custom annotation called "customLink" with a "url" field instead of the default "link" with "href"',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'customLink',
                title: 'Custom Link',
                type: 'object',
                fields: [
                  {
                    name: 'url',
                    title: 'URL',
                    type: 'url',
                  },
                ],
              },
            ],
          },
        },
      ],
      components: {
        portableText: {
          plugins: (props) => {
            return props.renderDefault({
              ...props,
              plugins: {
                ...props.plugins,
                pasteLink: {
                  link: ({context, value}) => {
                    const customLink = context.schema.annotations.find(
                      (a) => a.name === 'customLink',
                    )
                    if (!customLink) return undefined
                    return {_type: 'customLink', url: value.href}
                  },
                },
              },
            })
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
        portableText: {
          plugins: () => {
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
        portableText: {
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
