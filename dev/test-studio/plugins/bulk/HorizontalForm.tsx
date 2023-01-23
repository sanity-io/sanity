import React from 'react'
import {ObjectInputMember} from 'sanity'
export const HorizontalForm = (props) => {
  if (props.id !== 'root' || !window.location.pathname.includes('/bulk'))
    return props.renderDefault(props)
  // console.log('horizontal form props', props)

  const bulkFields = ['name', 'role', 'bestFriend']

  return (
    <div style={{display: 'flex'}}>
      {/* {props.renderDefault(props)} */}
      {props.members
        .filter((member) => bulkFields.includes(member.field.id))
        .map((member) => (
          <div style={{flex: '1', paddingRight: '5px'}} key={member.field.id}>
            <ObjectInputMember
              member={member}
              renderInput={props.renderInput}
              renderField={props.renderField}
            />
          </div>
        ))}
    </div>
  )
}
