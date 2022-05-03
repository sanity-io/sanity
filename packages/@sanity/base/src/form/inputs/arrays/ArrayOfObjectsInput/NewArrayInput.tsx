import React, {memo, useCallback} from 'react'
import {Button, Card} from '@sanity/ui'
import {ObjectSchemaType} from '@sanity/types'
import {createProtoValue} from '../../../utils/createProtoValue'
import {randomKey} from '../common/randomKey'
import {ArrayOfObjectsInputProps} from '../../../types'
import {ItemMember} from './ItemMember'

export const ArrayInput = memo(function ArrayInput(props: ArrayOfObjectsInputProps) {
  const {schemaType, members, onInsert, renderItem} = props

  const insert = useCallback(
    (itemType: ObjectSchemaType) => {
      onInsert({
        items: [{...createProtoValue(itemType), _key: randomKey(12)}],
        position: 'after',
        referenceItem: -1,
      })
    },
    [onInsert]
  )

  return (
    <>
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
    </>
  )
})
