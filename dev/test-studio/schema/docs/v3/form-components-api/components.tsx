import React, {useCallback} from 'react'
import {hues} from '@sanity/color'
import {Box, Stack, Heading, Flex, Inline, Text, Grid} from '@sanity/ui'
import {
  ArrayOfPrimitivesInputProps,
  ArraySchemaType,
  ArrayOfPrimitivesFunctions,
  FieldProps,
  ArrayInputFunctionsProps,
  InputProps,
  ItemProps,
  PreviewProps,
} from 'sanity'
import {Button} from '../../../../../../packages/sanity/src/ui'

const COMPONENT_COLORS = {
  input: hues.blue[400].hex,
  field: hues.yellow[400].hex,
  preview: hues.red[400].hex,
  item: hues.green[400].hex,
}

export function FormInput(props: InputProps) {
  return (
    <Stack space={5} padding={3}>
      <Stack space={4}>
        <Stack space={4}>
          <Heading>Form components API test</Heading>
          <Text size={1}>
            The borders are configured in the schema, and the backgrounds are configured in the
            config and in a plugin.
          </Text>
        </Stack>

        <Flex align="center" gap={4}>
          {Object.entries(COMPONENT_COLORS).map(([key, value]) => (
            <Inline space={2} key={key}>
              <div style={{width: '1em', height: '1em', background: value, borderRadius: '50%'}} />
              <Text size={1} weight="semibold">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </Inline>
          ))}
        </Flex>
      </Stack>

      <CustomInput {...props} testId="" />
    </Stack>
  )
}

export function CustomField(props: FieldProps & {testId: string}) {
  return (
    <Box
      data-testid={props.testId}
      padding={2}
      style={{border: `4px solid ${COMPONENT_COLORS.field}`}}
    >
      {props.renderDefault(props)}
    </Box>
  )
}

export function CustomInput(props: InputProps & {testId: string}) {
  return (
    <Box
      data-testid={props.testId}
      padding={2}
      style={{border: `4px solid ${COMPONENT_COLORS.input}`}}
    >
      {props.renderDefault(props)}
    </Box>
  )
}

export function CustomItem(props: ItemProps & {testId: string}) {
  return (
    <Box
      data-testid={props.testId}
      padding={2}
      style={{border: `4px solid ${COMPONENT_COLORS.item}`}}
    >
      {props.renderDefault(props)}
    </Box>
  )
}

export function CustomPreview(props: PreviewProps & {testId: string}) {
  return (
    <Box
      data-testid={props.testId}
      padding={2}
      style={{border: `4px solid ${COMPONENT_COLORS.preview}`}}
    >
      {props.renderDefault(props)}
    </Box>
  )
}

function ArrayActions(props: ArrayInputFunctionsProps<string | number | boolean, ArraySchemaType>) {
  const handleAdd = useCallback(() => {
    props.onItemAppend('Hello!')
  }, [props])

  return (
    <Grid columns={1} gap={2} data-testid="input-schema-array-primitives-custom-functions">
      <Button text="Custom array function" onClick={handleAdd} />

      <ArrayOfPrimitivesFunctions {...props} />
    </Grid>
  )
}

export function ArrayWithCustomActions(props: ArrayOfPrimitivesInputProps) {
  return props.renderDefault({...props, arrayFunctions: ArrayActions})
}
