import {ObjectSchemaType, ReferenceSchemaType} from '@sanity/types'
import {Card, Container, Flex} from '@sanity/ui'
import {useAction} from '@sanity/ui-workshop'
import React, {useMemo, useState} from 'react'
import {useSchema} from '../../../../hooks'
import {StudioFormBuilderProvider} from '../../../studio/StudioFormBuilderProvider'
import {ReviewChangesContextProvider} from '../../../studio/contexts/reviewChanges/ReviewChangesProvider'
import {createPatchChannel} from '../../../patch/PatchChannel'

export default function ReferenceInputStory() {
  const schema = useSchema()
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
            TODO
            {/* <StudioFormBuilderProvider
              __internal_patchChannel={patchChannel}
              onChange={onChange}
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
            </StudioFormBuilderProvider> */}
          </ReviewChangesContextProvider>
        </Container>
      </Flex>
    </Card>
  )
}
