import {CloseIcon, EyeOpenIcon} from '@sanity/icons'
import {Box, Button, Card, Checkbox, Flex, Inline, Stack, Text} from '@sanity/ui'
import {useState} from 'react'
import {
  FormInput,
  type ObjectInputProps,
  type Path,
  pathToString,
  type RenderInputCallback,
} from 'sanity'

export function FormInputExample(props: ObjectInputProps) {
  const [path, setPath] = useState<Path>([])

  const [includeField, setIncludeField] = useState(false)
  const [includeItem, setIncludeItem] = useState(false)

  const renderDefaultForm = path.length === 0

  const renderInput: RenderInputCallback = (inputProps) => {
    // wraps each input with a button that allows rendering only the selected input
    const selected = inputProps.path === path
    return (
      <Flex>
        <Box flex={1}>{props.renderInput(inputProps)}</Box>
        <Flex marginLeft={2}>
          <Button
            mode="ghost"
            tone="primary"
            fontSize={1}
            onClick={() => setPath(selected ? [] : inputProps.path)}
            icon={selected ? CloseIcon : EyeOpenIcon}
          />
        </Flex>
      </Flex>
    )
  }

  if (renderDefaultForm) {
    return (
      <Stack space={2}>
        <Card shadow={2} margin={3} padding={4} radius={2}>
          {props.renderDefault({...props, renderInput})}
        </Card>
      </Stack>
    )
  }
  return (
    <Stack space={2}>
      <Card padding={3} radius={2}>
        <Stack space={4}>
          <Stack space={4}>
            <Flex gap={2}>
              <Text weight="semibold">
                Input at <code>{pathToString(path)}</code>
              </Text>
            </Flex>
            <Flex gap={4}>
              <Inline space={2}>
                <Checkbox checked={includeField} onChange={() => setIncludeField((v) => !v)} />{' '}
                <Text>Include field</Text>
              </Inline>
              <Inline space={2}>
                <Checkbox checked={includeItem} onChange={() => setIncludeItem((v) => !v)} />{' '}
                <Text>Include item</Text>
              </Inline>
            </Flex>
          </Stack>
          <Card shadow={2} padding={3} radius={2}>
            <FormInput
              {...props}
              renderInput={renderInput}
              absolutePath={path}
              includeField={includeField}
              includeItem={includeItem}
            />
          </Card>
        </Stack>
      </Card>
    </Stack>
  )
}
