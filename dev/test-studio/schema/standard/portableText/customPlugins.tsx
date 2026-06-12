import {defineBehavior, effect, forward, raise} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {CharacterPairDecoratorPlugin} from '@portabletext/plugin-character-pair-decorator'
import {TablePlugin} from '@portabletext/plugin-table'
import {useState} from 'react'
import {defineArrayMember, defineType, type PortableTextPluginsProps} from 'sanity'

/**
 * Upgrade a bare `{_type: 'table'}` insert (what the Studio toolbar
 * produces) to a 3x3 table. Raising the modified event re-enters the
 * behavior chain; the guard fails on the upgraded block because it has
 * rows, so the raise does not loop.
 */
const tableEditorBehaviors = [
  defineBehavior({
    on: 'insert.block',
    guard: ({snapshot, event}) => {
      const block = event.block as {_type?: string; rows?: unknown[]}
      if (block._type !== 'table' || (block.rows?.length ?? 0) > 0) {
        return false
      }
      return {keyGenerator: snapshot.context.keyGenerator}
    },
    actions: [
      ({event}, {keyGenerator}) => [
        raise({
          ...event,
          block: {
            ...event.block,
            rows: Array.from({length: 3}, () => ({
              _type: 'row',
              _key: keyGenerator(),
              cells: Array.from({length: 3}, () => ({
                _type: 'cell',
                _key: keyGenerator(),
                content: [
                  {
                    _type: 'block',
                    _key: keyGenerator(),
                    style: 'normal',
                    markDefs: [],
                    children: [{_type: 'span', _key: keyGenerator(), text: '', marks: []}],
                  },
                ],
              })),
            })),
          },
        }),
      ],
    ],
  }),
]

const tableEditorCss = `
  table[data-pt-block='container'] {
    border-collapse: collapse;
    width: 100%;
    margin: 0.5rem 0;
  }
  table[data-pt-block='container'] td {
    border: 1px solid #c5cad3;
    padding: 0.35rem 0.6rem;
    vertical-align: top;
    min-width: 4rem;
  }
  table[data-pt-block='container'][data-pt-plugin-table-header-row]
    tr:first-child
    td {
    background: #f2f3f5;
    font-weight: 600;
  }
`

/**
 * Plugins for the Table Editor field, with a toggle that mounts and
 * unmounts the `TablePlugin` live. Toggling off unregisters the
 * `table`/`row`/`cell` containers, demonstrating dynamic node
 * registration: the same value re-renders through Studio's block-object
 * catch-all instead of as an editable container.
 */
function TableEditorPlugins(props: PortableTextPluginsProps) {
  const [tableEnabled, setTableEnabled] = useState(true)

  return (
    <>
      {tableEnabled && (
        <>
          <TablePlugin />
          <BehaviorPlugin behaviors={tableEditorBehaviors} />
        </>
      )}
      {/* eslint-disable-next-line react/no-danger -- validation rig styling */}
      <style dangerouslySetInnerHTML={{__html: tableEditorCss}} />
      <label
        style={{
          display: 'inline-flex',
          gap: '0.4em',
          alignItems: 'center',
          fontSize: '0.8em',
          padding: '0.2em 0',
        }}
      >
        <input
          type="checkbox"
          checked={tableEnabled}
          onChange={(domEvent) => setTableEnabled(domEvent.currentTarget.checked)}
        />
        Table plugin enabled
      </label>
      {props.renderDefault(props)}
    </>
  )
}

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
     * Table Editor
     *
     * Uses `components.portableText.plugins` to mount the `TablePlugin`,
     * registering `table`/`row`/`cell` containers for nested editable
     * tables. Validates that container plugins compose with Studio's
     * chrome through the consumer extension vehicle.
     */
    {
      type: 'array',
      name: 'tableEditor',
      title: 'Table Editor',
      description:
        'Editable tables via <TablePlugin /> mounted through components.portableText.plugins',
      of: [
        {type: 'block'},
        {
          type: 'image',
          title: 'Image',
          options: {hotspot: true},
          fields: [
            {name: 'caption', type: 'string', title: 'Caption'},
            {name: 'alt', type: 'string', title: 'Alternative text'},
          ],
        },
        {
          type: 'object',
          name: 'table',
          title: 'Table',
          fields: [
            {
              type: 'array',
              name: 'rows',
              of: [
                {
                  type: 'object',
                  name: 'row',
                  fields: [
                    {
                      type: 'array',
                      name: 'cells',
                      of: [
                        {
                          type: 'object',
                          name: 'cell',
                          fields: [
                            {
                              type: 'array',
                              name: 'content',
                              of: [
                                {type: 'block'},
                                {
                                  type: 'image',
                                  title: 'Image',
                                  options: {hotspot: true},
                                  fields: [
                                    {name: 'caption', type: 'string', title: 'Caption'},
                                    {name: 'alt', type: 'string', title: 'Alternative text'},
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'boolean',
              name: 'headerRow',
            },
          ],
        },
      ],
      components: {
        portableText: {
          plugins: TableEditorPlugins,
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
