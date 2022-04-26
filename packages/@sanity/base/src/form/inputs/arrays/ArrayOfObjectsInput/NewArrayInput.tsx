import {Button, Card} from '@sanity/ui'
import {ObjectSchemaType} from '@sanity/types'
import React, {memo, useCallback} from 'react'
import {FormFieldSet} from '../../../components/formField'
import {ArrayInputProps} from '../../../types'
import {createProtoValue} from '../../../utils/createProtoValue'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {randomKey} from '../common/randomKey'
import {ItemMember} from './ItemMember'

export const ArrayInput = memo(function ArrayInput(props: ArrayInputProps) {
  const {
    // focusRef,
    collapsed,
    collapsible,
    inputProps,
    level,
    members,
    onInsert,
    onSetCollapsed,
    presence,
    renderItem,
    type,
    validation,
  } = props

  const insert = useCallback(
    (itemType: ObjectSchemaType) => {
      onInsert({
        items: [{...createProtoValue(itemType), _key: randomKey(12)}],
        position: 'after',
        reference: -1,
      })
    },
    [onInsert]
  )

  return (
    <FormFieldSet
      __unstable_changeIndicator={false}
      __unstable_presence={collapsed ? presence : EMPTY_ARRAY}
      collapsed={collapsed}
      collapsible={collapsible}
      description={type.description}
      id={inputProps.id}
      level={level}
      onSetCollapsed={onSetCollapsed}
      ref={collapsed ? inputProps.ref : null}
      title={type.title}
      validation={collapsed ? validation : EMPTY_ARRAY}
    >
      {type.of.map((memberType) => {
        return (
          <Button
            key={memberType.name}
            onClick={() => insert(memberType as ObjectSchemaType)}
            text="Add"
          />
        )
      })}

      {members.map((member, index) => {
        if (member.type !== 'item') {
          return 'Non item members not supported currently'
        }
        return (
          <Card key={member.key} shadow={member.item.focused ? 1 : 0}>
            <ItemMember key={member.key} renderItem={renderItem} member={member} />
          </Card>
        )
      })}
    </FormFieldSet>
  )
})
