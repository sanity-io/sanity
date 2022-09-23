import {Box, Button, Dialog, Flex, Heading, Inline, Stack, Text} from '@sanity/ui'
import React, {useState} from 'react'
import {defineType, FieldProps, InputProps, PreviewProps} from 'sanity'
import {structureGroupOptions} from '../../../structure/groupByOption'

const COMPONENT_COLORS = {
  input: 'royalblue',
  field: 'magenta',
  preview: 'orange',
}

function MyField(props: FieldProps) {
  return (
    <div style={{border: `4px solid ${COMPONENT_COLORS.field}`, padding: '.15rem'}}>
      {props.renderNext(props)}
    </div>
  )
}

function MyInput(props: InputProps) {
  return (
    <div style={{border: `4px solid ${COMPONENT_COLORS.input}`, padding: '.15rem'}}>
      {props.renderNext(props)}
    </div>
  )
}

function MyPreview(props: PreviewProps) {
  return (
    <div style={{border: `4px solid ${COMPONENT_COLORS.preview}`, padding: '.15rem'}}>
      {props.renderNext(props)}
    </div>
  )
}

function FormInput(props: InputProps) {
  const [showDialog, setShowDialog] = useState<boolean>(false)

  return (
    <Stack space={5} padding={3}>
      <Stack space={4}>
        <Stack space={3}>
          <Heading>Form components API test</Heading>
          <Text size={1}>
            The borders are configured in the scheme and the backgrounds are configured in the
            config
          </Text>
        </Stack>

        <Flex align="center" gap={4}>
          {Object.entries(COMPONENT_COLORS).map(([key, value]) => (
            <Inline space={2} key={key}>
              <div style={{width: 10, height: 10, background: value, borderRadius: '50%'}} />
              <Text size={1} weight="semibold">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </Inline>
          ))}
        </Flex>

        <Flex>
          <Button text="Open dialog" fontSize={1} onClick={() => setShowDialog((v) => !v)} />
        </Flex>
      </Stack>

      {showDialog && (
        <Dialog
          id="form"
          onClickOutside={() => setShowDialog(false)}
          onClose={() => setShowDialog(false)}
          width={2}
        >
          <Box padding={3}>{props.renderNext(props)}</Box>
        </Dialog>
      )}

      {props.renderNext(props)}
    </Stack>
  )
}

export default defineType({
  type: 'document',
  title: 'v3 form components',
  name: 'formComponentsApi',
  options: structureGroupOptions({
    structureGroup: 'v3',
  }),
  components: {
    input: FormInput,
  },
  fields: [
    {
      type: 'boolean',
      name: 'boolean',
      title: 'Boolean',
      description: 'Basic boolean',
      //   components: {
      //     field: MyField,
      //     input: MyInput,
      //   },
    },
    {
      type: 'string',
      name: 'string',
      title: 'String',
      description: 'Basic string',
      components: {
        field: MyField,
        input: MyInput,
      },
    },
    {
      type: 'reference',
      name: 'reference',
      title: 'Reference',
      description: 'Basic reference',
      to: [{type: 'author'}],
      components: {
        field: MyField,
        input: MyInput,
      },
    },
    {
      type: 'image',
      name: 'image',
      title: 'Image',
      description: 'Basic image',
      components: {
        field: MyField,
        input: MyInput,
      },
    },
    {
      type: 'array',
      title: 'Array of primitives',
      name: 'arrayOfPrimitives',
      of: [
        {
          type: 'string',
          components: {
            input: MyInput,
          },
        },
        {
          type: 'number',
          components: {
            input: MyInput,
          },
        },
      ],
      components: {
        field: MyField,
        input: MyInput,
      },
    },
  ],
})
