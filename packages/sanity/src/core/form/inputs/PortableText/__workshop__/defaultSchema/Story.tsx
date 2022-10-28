import {SanityClient} from '@sanity/client'
import {Card, Container, Flex} from '@sanity/ui'
import {useAction, useSelect} from '@sanity/ui-workshop'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {Path} from '@sanity/types'
import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {createPatchChannel} from '../../../../patch/PatchChannel'
import {ArrayOfObjectsMember} from '../../../../store'
import {applyAll} from '../../../../patch/applyPatch'
import {FormPatch, PatchEvent} from '../../../../patch'
import {defineConfig} from '../../../../../config'
import {StudioProvider} from '../../../../../studio'
import {useSchema} from '../../../../../hooks'
import {valueOptions, values} from './values'

const ptType = {
  type: 'array',
  name: 'body',
  of: [{type: 'block'}],
}

const config = defineConfig({
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
  const handleAppendItem = useAction('onItemAppend')
  const handleBlur = useAction('onBlur')
  const handleFocus = useAction('onFocus')
  const handleInsert = useAction('onInsert')
  const handleMoveItem = useAction('onMoveItem')
  const handlePrependItem = useAction('onItemPrepend')
  const handleRemoveItem = useAction('onItemRemove')
  const handleOpenItem = useAction('onItemOpen')
  const handleCloseItem = useAction('onItemClose')
  const handleExpand = useAction('onExpand')
  const handleCollapse = useAction('onCollapse')
  const handleCollapseItem = useAction('onItemCollapse')
  const handleExpandItem = useAction('onItemExpand')
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
  //   <FormProvider
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
  //       onItemAppend={handleAppendItem}
  //       onBlur={handleBlur}
  //       onChange={handleChange}
  //       onFocus={handleFocus}
  //       onPathFocus={setFocusPath}
  //       onInsert={handleInsert}
  //       onMoveItem={handleMoveItem}
  //       onItemPrepend={handlePrependItem}
  //       onItemRemove={handleRemoveItem}
  //       onCollapse={handleCollapse}
  //       onItemOpen={handleOpenItem}
  //       onItemClose={handleCloseItem}
  //       onExpand={handleExpand}
  //       onItemCollapse={handleCollapseItem}
  //       onItemExpand={handleExpandItem}
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
  //   </FormProvider>
  // )
}
