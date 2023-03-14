import React, {useEffect} from 'react'
import {
  ArrayOfObjectsItem,
  BlockAnnotationProps,
  BlockProps,
  FormCallbacksProvider,
  FormInput,
  ObjectSchemaType,
  PreviewProps,
  defineArrayMember,
  defineType,
  useFormCallbacks,
} from 'sanity'
import {toPlainText} from '@portabletext/react'
import {Box, Button, Card, Inline, Popover} from '@sanity/ui'
import {CalloutPreview} from './components/CalloutPreview'

const linkType = defineArrayMember({
  type: 'object',
  name: 'link',
  fields: [
    {
      type: 'string',
      name: 'href',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}).required(),
    },
  ],
  options: {
    modal: {
      type: 'popover',
      width: 2,
    },
  },
  components: {
    annotation: (props: BlockAnnotationProps) => {
      return (
        <span style={{border: '1px solid yellow', fontWeight: props.selected ? 900 : undefined}}>
          {
            <Popover
              boundaryElement={props.__unstable_boundaryElement}
              constrainSize
              open={!props.open && props.focused}
              // fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
              placement="top"
              portal="editor"
              referenceElement={props.__unstable_referenceElement}
              scheme="light"
              content={
                <Box padding={1}>
                  <Inline space={1}>
                    <Button mode="bleed" padding={2} onClick={props.onOpen}>
                      Open
                    </Button>
                    <Button mode="bleed" padding={2} onClick={props.onRemove}>
                      Remove
                    </Button>
                    <Button
                      mode="bleed"
                      padding={2}
                      onClick={() => alert(JSON.stringify(props.value))}
                    >
                      Display value
                    </Button>
                  </Inline>
                </Box>
              }
            />
          }
          {props.children}
        </span>
      )
    },
  },
})

const preventDefault = (e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const BlockInlineEditing = (props: BlockProps) => {
  const {focused, renderPreview, onOpen, onClose} = props
  useEffect(() => {
    if (focused) {
      onOpen()
    } else {
      onClose()
    }
  }, [focused, onClose, onOpen])

  return (
    <Box onDoubleClick={onOpen} onDragStart={preventDefault}>
      {renderPreview({
        schemaType: props.schemaType,
        value: props.value,
        layout: 'media',
        actions: () => <div>Actions</div>,
      })}
      {focused && (
        <Card padding={2} margin={2} shadow={1} radius={2}>
          {props.children}
        </Card>
      )}
    </Box>
  )
}

const BlockImageInlineEditing = (props: BlockProps) => {
  const {focused, onOpen, onClose} = props
  useEffect(() => {
    if (focused) {
      onOpen()
    } else {
      onClose()
    }
  }, [focused, onClose, onOpen])

  return <>{props.children}</>
}

const InlineBlockInlineEditing = (props: BlockProps) => {
  const {onOpen, onClose, focused} = props
  useEffect(() => {
    if (focused) {
      onOpen()
    } else {
      onClose()
    }
  }, [focused, onOpen, onClose])
  return (
    <Card>
      {props.renderPreview({
        schemaType: props.schemaType,
        value: props.value,
        layout: 'inline',
      })}
      {props.focused && props.open && props.children}
    </Card>
  )
}

const myStringType = defineArrayMember({
  type: 'object',
  name: 'test',
  fields: [{type: 'string', name: 'mystring', validation: (Rule) => Rule.required()}],
  options: {
    modal: {type: 'popover', width: 1},
  },
  components: {
    // block: (props: BlockProps) => {
    //   return props.renderDefault({
    //     ...props,
    //     children: <>{props.children}</>,
    //   })
    //   // return <BlockImageInlineEditing {...props} />
    // },
    // inlineBlock: InlineBlockInlineEditing,
  },
})

export default defineType({
  name: 'simpleBlock',
  title: 'Simple block',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [linkType, myStringType],
          },
          of: [
            {type: 'image', name: 'image'},
            myStringType,
            {
              type: 'reference',
              name: 'strongAuthorRef',
              title: 'A strong author ref',
              to: {type: 'author'},
            },
          ],
          validation: (Rule) =>
            Rule.custom<any>((block) => {
              const text = toPlainText(block ? [block] : [])
              return text.length === 1 ? 'Please write a longer paragraph.' : true
            }),
          options: {
            spellCheck: true,
          },
        }),
        {
          type: 'image',
          name: 'image',
          options: {
            modal: {
              // The default `type` of object blocks is 'dialog'
              // type: 'dialog',
              // The default `width` of object blocks is 'medium'
              // width: 'small',
            },
          },
          components: {
            block: (props: BlockProps) => <BlockImageInlineEditing {...props} />,
            // block: (props: BlockProps) => {
            //   return <Box>Something crazy here but keep the actions!{props.children} {props.actions}</Box>
            // },
            // block: (props: BlockProps) => {
            //   return props.renderDefault(props)
            // },
            // block: (props: BlockProps) =>
            //   props.renderDefault({
            //     ...props,
            //     actions: (
            //       <Popover
            //         boundaryElement={props.boundaryElement}
            //         constrainSize
            //         open={!props.open && props.focused}
            //         // fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
            //         placement="top"
            //         portal="editor"
            //         referenceElement={props.referenceElement}
            //         scheme="light"
            //         content={
            //           <Box padding={1}>
            //             <Inline space={1}>
            //               <Button mode="bleed" padding={2} onClick={props.onOpen}>
            //                 Open
            //               </Button>
            //               <Button mode="bleed" padding={2} onClick={props.onRemove}>
            //                 Remove
            //               </Button>
            //               <Button
            //                 mode="bleed"
            //                 padding={2}
            //                 onClick={() => alert(JSON.stringify(props.value))}
            //               >
            //                 Display value
            //               </Button>
            //             </Inline>
            //           </Box>
            //         }
            //       />
            //     ),
            //   }),
          },
        },
        {
          type: 'object',
          name: 'callout',
          title: 'Callout',
          components: {
            preview: CalloutPreview,
          },
          fields: [
            {
              type: 'string',
              name: 'title',
              title: 'Title',
            },
            {
              type: 'string',
              name: 'tone',
              title: 'Tone',
              options: {
                list: [
                  {value: 'default', title: 'Default'},
                  {value: 'primary', title: 'Primary'},
                  {value: 'positive', title: 'Positive'},
                  {value: 'caution', title: 'Caution'},
                  {value: 'critical', title: 'Critical'},
                ],
              },
            },
          ],
          preview: {
            select: {
              title: 'title',
              tone: 'tone',
            },
          },
        },
        myStringType,
      ],
    },
    {
      name: 'notes',
      type: 'array',
      of: [
        {
          type: 'simpleBlockNote',
        },
      ],
    },
  ],
})
