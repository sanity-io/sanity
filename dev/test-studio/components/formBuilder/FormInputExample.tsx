import {CloseIcon} from '@sanity/icons/Close'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {Button, Card, Checkbox, Inline, Text} from '@sanity/ui'
import {useState} from 'react'
import {type ObjectInputProps, type Path, type RenderInputCallback} from 'sanity'
import {
  FormInput,
  pathToString,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {Flex, Box, VStack} from 'ui5'

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
        <Box flexBasis="0%" flexGrow={1}>
          {props.renderInput(inputProps)}
        </Box>
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
      <VStack gap={2}>
        <Card shadow={2} margin={3} padding={4} radius={2}>
          {props.renderDefault({...props, renderInput})}
        </Card>
      </VStack>
    )
  }
  return (
    <VStack gap={2}>
      <Card padding={3} radius={2}>
        <VStack gap={4}>
          <VStack gap={4}>
            <Flex gap={2}>
              <Text weight="semibold">
                Input at <code>{pathToString(path)}</code>
              </Text>
            </Flex>
            <Flex gap={4}>
              <Inline gap={2}>
                <Checkbox checked={includeField} onChange={() => setIncludeField((v) => !v)} />{' '}
                <Text>Include field</Text>
              </Inline>
              <Inline gap={2}>
                <Checkbox checked={includeItem} onChange={() => setIncludeItem((v) => !v)} />{' '}
                <Text>Include item</Text>
              </Inline>
            </Flex>
          </VStack>
          <Card shadow={2} padding={3} radius={2}>
            <FormInput
              {...props}
              renderInput={renderInput}
              absolutePath={path}
              includeField={includeField}
              includeItem={includeItem}
            />
          </Card>
        </VStack>
      </Card>
    </VStack>
  )
}
