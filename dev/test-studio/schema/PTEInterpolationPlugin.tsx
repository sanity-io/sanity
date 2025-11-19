import {SparklesIcon} from '@sanity/icons'
import {PortableTextEditor, useEditor} from '@portabletext/editor'
import {useCallback} from 'react'
import {defineField, type PreviewProps, type PortableTextPluginsProps} from 'sanity'
import type {ObjectSchemaType} from '@sanity/types'
import {Box, Button, Menu, MenuButton, MenuItem, Stack} from '@sanity/ui'

/**
 * PTE Interpolation Plugin
 *
 * Adds a dropdown to the Portable Text Editor toolbar for inserting interpolation
 * variables (like [userLocale], [currentTime]) as inline objects.
 *
 * Usage:
 * ```typescript
 * const plugin = PTEInterpolationPlugin(['currentTime', 'userLocale'])
 *
 * {
 *   type: 'array',
 *   of: [{
 *     type: 'block',
 *     of: [plugin.inlineObject], // Add inline object
 *   }],
 *   components: {
 *     portableText: {
 *       plugins: (props) => (
 *         <>
 *           {props.renderDefault(props)}
 *           {plugin.toolbarPlugin(props)} // Add dropdown to toolbar
 *         </>
 *       ),
 *     },
 *   },
 * }
 * ```
 */

// Custom preview component that renders [variableName] with blue background
function InterpolationPreview(props: PreviewProps) {
  const key = (props as {value?: {key?: string}}).value?.key || 'unknown'

  return (
    <Box
      as="span"
      style={{
        display: 'inline-block',
        backgroundColor: '#e6f2ff',
        color: '#0066cc',
        padding: '2px 6px',
        borderRadius: '3px',
        fontFamily: 'monospace',
        fontSize: '0.9em',
        fontWeight: 500,
      }}
    >
      [{key}]
    </Box>
  )
}

// Dropdown component for selecting and inserting interpolation variables
function InterpolationDropdown(props: {
  values: string[]
  inlineObjectType: ObjectSchemaType
}) {
  const editor = useEditor()
  const {values, inlineObjectType} = props

  const handleInsert = useCallback(
    (key: string) => {
      if (!editor) return

      // Create the initial value for the inline object with the selected key
      const initialValue = {
        _type: 'interpolationVariable',
        _key: `interpolation-${Date.now()}`,
        key,
      }

      // Insert the inline object directly without opening a dialog
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      PortableTextEditor.insertChild(editor as any, inlineObjectType, initialValue)

      // Focus back to the editor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      PortableTextEditor.focus(editor as any)
    },
    [editor, inlineObjectType],
  )

  return (
    <MenuButton
      button={
        <Button
          mode="bleed"
          icon={SparklesIcon}
          text="Insert Values"
          fontSize={1}
          padding={2}
        />
      }
      id="interpolation-menu"
      menu={
        <Menu>
          <Stack space={1}>
            {values.map((value) => (
              <MenuItem
                key={value}
                text={value}
                onClick={() => {
                  handleInsert(value)
                }}
              />
            ))}
          </Stack>
        </Menu>
      }
      popover={{portal: true, tone: 'default'}}
    />
  )
}

export function PTEInterpolationPlugin(values: string[]) {
  // Define the inline object type
  const inlineObject = defineField({
    type: 'object',
    name: 'interpolationVariable',
    title: 'Interpolation Variable',
    fields: [
      {
        name: 'key',
        type: 'string',
        title: 'Variable Key',
        validation: (Rule) => Rule.required(),
        options: {
          list: values.map((value) => ({title: value, value})),
        },
      },
    ],
    components: {
      preview: InterpolationPreview,
    },
    preview: {
      select: {
        key: 'key',
      },
      prepare({key}) {
        return {
          title: `[${key}]`,
        }
      },
    },
  })

  // Cast the inline object to ObjectSchemaType for the editor API
  const inlineObjectType = inlineObject as unknown as ObjectSchemaType

  // Toolbar plugin component function that matches the expected signature
  const toolbarPluginComponent = (props: PortableTextPluginsProps) => {
    return (
      <>
        {props.renderDefault(props)}
        <InterpolationDropdown values={values} inlineObjectType={inlineObjectType} />
      </>
    )
  }

  return {
    inlineObject,
    toolbarPlugin: () => (
      <InterpolationDropdown values={values} inlineObjectType={inlineObjectType} />
    ),
    toolbarPluginComponent,
  }
}
