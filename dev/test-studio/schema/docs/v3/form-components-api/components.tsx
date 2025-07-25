import {hues} from '@sanity/color'
import {Box, Button, Flex, Grid, Heading, Inline, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {
  type ArrayInputFunctionsProps,
  ArrayOfPrimitivesFunctions,
  type ArrayOfPrimitivesInputProps,
  type ArraySchemaType,
  type FieldProps,
  type InputProps,
  type ItemProps,
  type PreviewProps,
} from 'sanity'

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
            <Inline key={key} space={2}>
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
