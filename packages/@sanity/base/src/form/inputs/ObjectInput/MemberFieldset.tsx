import React, {useCallback} from 'react'
import {FormFieldSet} from '../../components/formField'
import {FormNode, FormNodeProvider} from '../../components/formNode'
import {FieldSetMember, RenderFieldCallback} from '../../types'
import {EMPTY_ARRAY} from '../../utils/empty'

export function MemberFieldset(props: {member: FieldSetMember; renderField: RenderFieldCallback}) {
  const {member, renderField} = props

  const onSetCollapsed = useCallback((collapsed: boolean) => {
    console.warn('todo: set collapsed', collapsed)
  }, [])

  return (
    <FormNodeProvider
      compareValue={undefined}
      collapsed={false}
      collapsible={false}
      inputId={member.key}
      level={1}
      path={EMPTY_ARRAY}
      presence={EMPTY_ARRAY}
      type={member.fieldSet as any}
      validation={EMPTY_ARRAY}
    >
      <FormFieldSet onSetCollapsed={onSetCollapsed}>
        {member.fieldSet.fields.map((fieldsetMember) => (
          <FormNode
            fieldProps={fieldsetMember.field}
            renderField={renderField}
            key={fieldsetMember.key}
          />
        ))}
      </FormFieldSet>
    </FormNodeProvider>
  )
}
