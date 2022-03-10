import {useSource} from '@sanity/base'
import {ObjectSchemaType, ReferenceSchemaType} from '@sanity/types'
import {Card, Container, Flex} from '@sanity/ui'
import {useAction} from '@sanity/ui-workshop'
import React, {useMemo, useState} from 'react'
import {SanityFormBuilderProvider} from '../../../sanity/SanityFormBuilderProvider'
import {FormBuilderInput} from '../../../FormBuilderInput'
import {ReviewChangesContextProvider} from '../../../sanity/contexts/reviewChanges/ReviewChangesProvider'
import {createPatchChannel} from '../../../patchChannel'

export default function ReferenceInputStory() {
  const {schema} = useSource()
  const documentType = schema.get('referenceTest') as ObjectSchemaType
  const schemaType = documentType.fields?.find((f) => f.name === 'selfRef') as ReferenceSchemaType
  const patchChannel = useMemo(() => createPatchChannel(), [])
  const [value] = useState(undefined)
  const [focusPath] = useState([])

  const onBlur = useAction('onBlur')
  const onChange = useAction('onChange')
  const onFocus = useAction('onFocus')
  const path = useMemo(() => ['selfRef'], [])

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={0}>
          <ReviewChangesContextProvider changesOpen={false}>
            <SanityFormBuilderProvider
              __internal_patchChannel={patchChannel}
              schema={schema}
              value={value}
            >
              <FormBuilderInput
                focusPath={focusPath}
                level={1}
                onBlur={onBlur}
                onChange={onChange}
                onFocus={onFocus}
                path={path}
                presence={[]}
                type={schemaType}
                validation={[]}
                value={undefined}
              />
            </SanityFormBuilderProvider>
          </ReviewChangesContextProvider>
        </Container>
      </Flex>
    </Card>
  )
}
