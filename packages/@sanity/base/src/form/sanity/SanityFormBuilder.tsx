import {Schema, SchemaType} from '@sanity/types'
import React, {useCallback} from 'react'
import {PatchChannel} from '../patchChannel'
import {DocumentInput} from '../inputs/DocumentInput'
import {useSource} from '../../studio'
import {fallbackInputs} from '../fallbackInputs'
import {RenderArrayItemCallbackArg, RenderFieldCallbackArg} from '../types_v3'
import {ObjectInputProps} from '../store/formState'
import {ChangeIndicatorProvider} from '../../components/changeIndicators'
import {FieldProps} from '../store/types'
import {SanityFormBuilderProvider} from './SanityFormBuilderProvider'
import {resolveInputComponent as defaultInputResolver} from './inputResolver/inputResolver'
import {Box, Button, Card, Dialog, Flex, Text} from '@sanity/ui'

/**
 * @alpha
 */
export interface SanityFormBuilderProps extends ObjectInputProps {
  changesOpen: boolean
  compareValue?: any | null
  /**
   * @internal Considered internal – do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  autoFocus?: boolean
  readOnly?: boolean
  schema: Schema
}

/**
 * @alpha
 */
export function SanityFormBuilder(props: SanityFormBuilderProps) {
  const {
    __internal_patchChannel: patchChannel,
    onBlur,
    id,
    path,
    focused,
    focusPath,
    onChange,
    onFocus,
    onSelectFieldGroup,
    onSetCollapsed,
    presence,
    readOnly,
    schema,
    type,
    validation,
    value,
    members,
    groups,
  } = props

  const {unstable_formBuilder: formBuilder} = useSource()

  const resolveInputComponent = useCallback(
    (inputType: SchemaType) => {
      const resolved = defaultInputResolver(
        formBuilder.components?.inputs,
        formBuilder.resolveInputComponent,
        inputType
      )
      return resolved || (fallbackInputs[inputType.jsonType] as React.ComponentType<FieldProps>)
    },
    [formBuilder]
  )

  const renderField = useCallback(
    (field: RenderFieldCallbackArg) => {
      const Input = resolveInputComponent(field.type)
      if (!Input) {
        return <div>No input resolved for type: {field.type.name}</div>
      }
      return (
        <ChangeIndicatorProvider path={field.path} value={field.value} compareValue={undefined}>
          <Input
            {...field}
            validation={field.validation || []}
            presence={field.presence || []}
            renderField={renderField}
            renderItem={renderItem}
          />
        </ChangeIndicatorProvider>
      )
    },
    [resolveInputComponent]
  )

  const renderItem = useCallback(
    (item: RenderArrayItemCallbackArg) => {
      const Input = resolveInputComponent(item.type)
      if (!Input) {
        return <div>No input resolved for type: {item.type.name}</div>
      }
      return (
        <ChangeIndicatorProvider
          path={item.path}
          focusPath={item.focusPath}
          value={item.value}
          compareValue={undefined}
        >
          <Flex gap={1} align="center">
            <Box flex={1}>
              <Card
                as="button"
                shadow={1}
                padding={3}
                radius={2}
                selected={!item.collapsed}
                onClick={() => item.onSetCollapsed(false)}
              >
                <Text>[preview] {JSON.stringify(item.value?._key)}</Text>
              </Card>
              {!item.collapsed && (
                <Dialog
                  id={`edit-${item.id}`}
                  title="Edit"
                  onClickOutside={() => item.onSetCollapsed(true)}
                >
                  <Box padding={4}>
                    <Input
                      {...item}
                      validation={item.validation}
                      presence={item.presence}
                      renderField={renderField}
                      renderItem={renderItem}
                    />
                  </Box>
                </Dialog>
              )}
            </Box>

            <Box padding={2}>
              {item.collapsed ? (
                <Button
                  onClick={() => {
                    item.onSetCollapsed(false)
                  }}
                  text="Open"
                  mode="bleed"
                />
              ) : (
                <Button onClick={() => item.onSetCollapsed(true)} text="Close" mode="bleed" />
              )}
            </Box>
          </Flex>
        </ChangeIndicatorProvider>
      )
    },
    [resolveInputComponent]
  )

  return (
    <SanityFormBuilderProvider __internal_patchChannel={patchChannel} schema={schema} value={value}>
      <DocumentInput
        level={0}
        id={id}
        path={path}
        focused={focused}
        focusPath={focusPath}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        presence={presence}
        validation={validation}
        readOnly={readOnly}
        type={type}
        members={members}
        groups={groups}
        onSelectFieldGroup={onSelectFieldGroup}
        onSetCollapsed={onSetCollapsed}
        renderField={renderField}
        value={value}
      />
    </SanityFormBuilderProvider>
  )
}
