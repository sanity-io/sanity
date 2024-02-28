import {type ObjectInputProps} from 'sanity'
import styled from 'styled-components'

import {type TaskDocument} from '../../types'
import {ActivityLog} from '../activityLog'
import {StatusSelector} from './StatusSelector'
import {Title} from './TitleField'

const FirstRow = styled.div`
  display: flex;
  padding-bottom: 12px;
`
export function FormEdit(props: ObjectInputProps<TaskDocument>) {
  const statusField = props.schemaType.fields.find((f) => f.name === 'status')
  if (!statusField) {
    throw new Error('Status field not found')
  }
  return (
    <>
      <Title
        onChange={props.onChange}
        value={props.value?.title}
        path={['title']}
        placeholder="Task title"
      />
      <FirstRow>
        <StatusSelector
          value={props.value?.status}
          path={['status']}
          onChange={props.onChange}
          options={statusField.type.options.list}
        />
      </FirstRow>
      {props.renderDefault(props)}
      <ActivityLog />
    </>
  )
}
