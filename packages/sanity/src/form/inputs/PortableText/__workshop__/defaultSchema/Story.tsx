import {SanityClient} from '@sanity/client'
import {Card, Container, Flex} from '@sanity/ui'
import {useAction, useSelect} from '@sanity/ui-workshop'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {ArraySchemaType, Path} from '@sanity/types'
import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createConfig} from '../../../../../config'
import {useSchema} from '../../../../../hooks'
import {StudioProvider} from '../../../../../studio'
import {PortableTextInput} from '../../PortableTextInput'
import {createPatchChannel} from '../../../../patch/PatchChannel'
import {StudioFormBuilderProvider} from '../../../../studio/StudioFormBuilderProvider'
import {ArrayOfObjectsMember} from '../../../../store'
import {applyAll} from '../../../../patch/applyPatch'
import {FormPatch, PatchEvent} from '../../../../patch'
import {values, valueOptions} from './values'

const ptType = {
  type: 'array',
  name: 'body',
  of: [{type: 'block'}],
}

const config = createConfig({
  name: 'test',
  dataset: 'test',
  projectId: 'test',
  schema: {types: [ptType]},
  unstable_clientFactory: () => createMockSanityClient() as unknown as SanityClient,
})

export default function Story() {
  return (
    <StudioProvider config={config}>
      <Card height="fill" padding={4} sizing="border">
        <Flex align="center" height="fill" justify="center">
          <Container width={1}>
            <TestForm />
          </Container>
        </Flex>
      </Card>
    </StudioProvider>
  )
}

function TestForm() {
  const schema = useSchema()
  // const readOnly = useBoolean('Read only', false)
  // const withError = useBoolean('With error', false)
  // const withWarning = useBoolean('With warning', false)
  const selectedValue = useSelect('Values', valueOptions) || 'empty'
  const [value, setValue] = useState(values[selectedValue])
  const type = schema.get('body')
  const patchChannel = useMemo(() => createPatchChannel(), [])
  const [focusPath, setFocusPath] = useState<Path>([])
  const changed = false
  const focusRef = useRef()
  const handleAppendItem = useAction('onAppendItem')
  const handleBlur = useAction('onBlur')
  const handleFocus = useAction('onFocus')
  const handleInsert = useAction('onInsert')
  const handleMoveItem = useAction('onMoveItem')
  const handlePrependItem = useAction('onPrependItem')
  const handleRemoveItem = useAction('onRemoveItem')
  const handleOpenItem = useAction('onOpenItem')
  const handleCloseItem = useAction('onCloseItem')
  const handleExpand = useAction('onExpand')
  const handleCollapse = useAction('onCollapse')
  const handleCollapseItem = useAction('onCollapseItem')
  const handleExpandItem = useAction('onExpandItem')
  const members: ArrayOfObjectsMember[] = useMemo(() => [], [])
  const path = useMemo(() => [], [])
  const presence = useMemo(() => [], [])
  const renderField = useCallback(() => <>TODO</>, [])
  const renderInput = useCallback(() => <>TODO</>, [])
  const renderItem = useCallback(() => <>TODO</>, [])
  const renderPreview = useCallback(() => <>TODO</>, [])
  const resolveInitialValue = useCallback(() => Promise.resolve({} as any), [])
  const validation = useMemo(() => [], [])

  const handleChange = useCallback((arg: FormPatch | FormPatch[] | PatchEvent) => {
    if (arg instanceof PatchEvent) {
      setValue((prevValue) => applyAll(prevValue, arg.patches))
    } else if (Array.isArray(arg)) {
      setValue((prevValue) => applyAll(prevValue, arg))
    } else {
      setValue((prevValue) => applyAll(prevValue, [arg]))
    }
  }, [])

  if (!type) {
    return <>Type not found</>
  }

  return <>TODO</>

  // return (
  //   <StudioFormBuilderProvider
  //     __internal_patchChannel={patchChannel}
  //     onChange={handleChange}
  //     value={value}
  //   >
  //     <PortableTextInput
  //       compareValue={compareValue}
  //       focusPath={focusPath}
  //       focusRef={focusRef}
  //       id="test"
  //       level={0}
  //       members={members}
  //       onAppendItem={handleAppendItem}
  //       onBlur={handleBlur}
  //       onChange={handleChange}
  //       onFocus={handleFocus}
  //       onFocusPath={setFocusPath}
  //       onInsert={handleInsert}
  //       onMoveItem={handleMoveItem}
  //       onPrependItem={handlePrependItem}
  //       onRemoveItem={handleRemoveItem}
  //       onCollapse={handleCollapse}
  //       onOpenItem={handleOpenItem}
  //       onCloseItem={handleCloseItem}
  //       onExpand={handleExpand}
  //       onCollapseItem={handleCollapseItem}
  //       onExpandItem={handleExpandItem}
  //       path={path}
  //       presence={presence}
  //       renderField={renderField}
  //       renderInput={renderInput}
  //       renderItem={renderItem}
  //       resolveInitialValue={resolveInitialValue}
  //       schemaType={type as ArraySchemaType}
  //       validation={validation}
  //       value={value}
  //     />
  //   </StudioFormBuilderProvider>
  // )
}
