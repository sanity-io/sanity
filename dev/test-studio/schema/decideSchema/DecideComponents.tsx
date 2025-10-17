import {ControlsIcon} from '@sanity/icons'
import {Button, Flex, Stack} from '@sanity/ui'
import * as Path from '@sanity/util/paths'
import {uuid} from '@sanity/uuid'
import {useCallback, useEffect, useState} from 'react'
import {
  defineDocumentFieldAction,
  EditPortal,
  FormInput,
  insert,
  type ObjectFieldProps,
  type ObjectInputProps,
  set,
  unset,
  useFormValue,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'
import {styled} from 'styled-components'

import {ExpressionBuilder} from './ExpressionBuilder'
import {type Decide} from './types'

const VARIANTS_PATH = 'variants'
const ObjectWrapper = styled.div`
  /* the second div inside the fieldset of the decide field should not have padding */
  & > fieldset > div:nth-child(2) {
    padding: 0;
    border-left: none;
    box-shadow: none;
  }
`

export const addVariantAction = defineDocumentFieldAction({
  name: 'addVariant',
  useAction(context) {
    const {path} = context
    const {onPathOpen} = useDocumentPane()
    const onAction = useCallback(() => {
      //  Set the context to open the decide field
      onPathOpen(path.concat([VARIANTS_PATH]))
    }, [onPathOpen, path])

    return {
      type: 'action',
      icon: ControlsIcon,
      onAction,
      title: 'Configure variants',
    }
  },
})

export function DecideObjectField(props: ObjectFieldProps) {
  return (
    <ObjectWrapper data-ui="decide-field-wrapper">
      {props.renderDefault({...props, actions: [...(props.actions || []), addVariantAction]})}
    </ObjectWrapper>
  )
}

export const DecideObjectInput = (props: ObjectInputProps) => {
  const {openPath, onPathOpen} = useDocumentPane()
  const {path, onChange} = props
  const [view, setView] = useState<'expressionBuilder' | 'form'>('form')
  const value = useFormValue(path) as Decide | undefined
  const isConditionsOpen = Path.toString(openPath).startsWith(
    Path.toString(path.concat([VARIANTS_PATH])),
  )

  useEffect(() => {
    if (value && !value?._type) {
      onChange(set('sanity.decideField', ['_type']))
    }
    // Check if only value._type is present, if it's the only key remove it to remove the object
    if (value && Object.keys(value).length === 1 && value._type) {
      onChange(unset(['_type']))
    }
  }, [onChange, value?._type, value])

  return (
    <Stack space={2}>
      <Flex>
        <Button
          mode="ghost"
          tone="default"
          padding={2}
          space={2}
          text={view === 'expressionBuilder' ? 'Show form' : 'Show builder'}
          onClick={() => setView(view === 'expressionBuilder' ? 'form' : 'expressionBuilder')}
        />
      </Flex>
      <FormInput {...props} includeField={false} relativePath={['default']} />
      {view === 'expressionBuilder' ? (
        <ExpressionBuilder {...props} />
      ) : (
        <>
          {isConditionsOpen && (
            <EditPortal
              type="dialog"
              header="Variants"
              id="variants-edit-portal"
              onClose={() => onPathOpen(path)}
              width={props.schemaType.options?.modal?.width ?? 1}
            >
              <FormInput {...props} includeField relativePath={[VARIANTS_PATH]} />
            </EditPortal>
          )}
          {value?.variants && value.variants.length > 0 && (
            <Flex justify="space-between" align="center">
              <Button
                size={1}
                mode="bleed"
                tone="default"
                padding={2}
                space={2}
                muted
                text={`${value.variants.length} variants available`}
                onClick={() => onPathOpen(path.concat([VARIANTS_PATH]))}
              />

              <Button
                mode="bleed"
                tone="default"
                padding={2}
                space={2}
                text="Add variant"
                onClick={() => {
                  // Do a mutation to create a new condition
                  const key = uuid()
                  const newCondition = {
                    _key: key,
                    _type: 'variant',
                  }
                  onChange(insert([newCondition], 'after', [VARIANTS_PATH, -1]))
                  onPathOpen(path.concat([VARIANTS_PATH, {_key: key}]))
                }}
              />
            </Flex>
          )}
        </>
      )}
    </Stack>
  )
}

export const WhenExpressionInput = (props: ObjectInputProps) => {
  // const value = props.value as Expr
  return (
    <ObjectWrapper data-ui="or-expression-wrapper">
      <Stack space={3}>
        {/* {value?.kind === 'or' ? (
          <>
            <Text size={1} weight="medium">
              If one of
            </Text>
            <Text size={1} muted>
              If any of the rules are true, the condition is true
            </Text>
          </>
        ) : value?.kind === 'and' ? (
          <>
            <Text size={1} weight="medium">
              If all of
            </Text>
            <Text size={1} muted>
              All of the rules must be true for the condition to be true
            </Text>
          </>
        ) : null} */}
        {props.renderDefault(props)}
      </Stack>
    </ObjectWrapper>
  )
}

export const VariantObjectField = (props: ObjectFieldProps) => {
  return (
    <ObjectWrapper data-ui="variant-object-wrapper">{props.renderDefault(props)}</ObjectWrapper>
  )
}
