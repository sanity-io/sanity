import React, {ForwardedRef, forwardRef, memo} from 'react'
import {Button} from '@sanity/ui'
import {insert, PatchEvent} from '../../../patch'
import {createProtoValue} from '../../../utils/createProtoValue'
import {randomKey} from '../common/randomKey'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {FormFieldSet} from '../../../../components/formField'
import {ArrayInputComponentProps} from '../../../types_v3'
import {ItemMember} from './ItemMember'

export const ArrayInput = memo(function ArrayInput(props: ArrayInputComponentProps) {
  const {
    type,
    members,
    collapsed,
    collapsible,
    presence,
    validation,
    level,
    onChange,
    renderItem,
    focusRef,
    id,
    onSetCollapsed,
  } = props

  return (
    <FormFieldSet
      ref={collapsed ? focusRef : null}
      level={level}
      title={type.title}
      id={id}
      description={type.description}
      collapsible={collapsible}
      collapsed={collapsed}
      onSetCollapsed={onSetCollapsed}
      __unstable_presence={collapsed ? presence : EMPTY_ARRAY}
      validation={collapsed ? validation : EMPTY_ARRAY}
      __unstable_changeIndicator={false}
    >
      <Button
        onClick={() => {
          onChange(
            PatchEvent.from([
              insert([{...createProtoValue(type.of[0].type!), _key: randomKey(12)}], 'after', [-1]),
            ])
          )
        }}
        text="Add"
      />

      {members.map((member, index) => {
        return (
          <ItemMember key={(member.value as any)._key} renderItem={renderItem} member={member} />
        )
      })}
    </FormFieldSet>
  )
})
