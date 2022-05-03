import React, {memo, useCallback} from 'react'
import {Button, Card} from '@sanity/ui'
import {ObjectSchemaType} from '@sanity/types'
import {createProtoValue} from '../../../utils/createProtoValue'
import {randomKey} from '../common/randomKey'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {ItemMember} from './ItemMember'
import {ArrayOfObjectsInputProps} from '../../../types'
import {FormFieldSet} from '../../../components/formField/FormFieldSet'

export const ArrayInput = memo(function ArrayInput(props: ArrayOfObjectsInputProps) {
  const {
    schemaType,
    members,
    collapsed,
    collapsible,
    presence,
    validation,
    onInsert,
    level,
    renderItem,
    focusRef,
    id,
    onSetCollapsed,
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
      ref={collapsed ? focusRef : null}
      level={level}
      title={schemaType.title}
      id={id}
      description={schemaType.description}
      collapsible={collapsible}
      collapsed={collapsed}
      onSetCollapsed={onSetCollapsed}
      __unstable_presence={collapsed ? presence : EMPTY_ARRAY}
      validation={collapsed ? validation : EMPTY_ARRAY}
      __unstable_changeIndicator={false}
    >
      {schemaType.of.map((memberType) => {
        return (
          <Button
            key={memberType.name}
            onClick={() => insert(memberType as ObjectSchemaType)}
            text="Add"
          />
        )
      })}
      {members.map((member, index) => {
        if (member.kind !== 'item') {
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
