import DurationWithSecondsInput from '../components/DurationWithSecondsInput'

export default {
  type: 'document',
  name: 'durationWithSecondsExample',
  fields: [
    {title: 'Title', name: 'title', type: 'string'},
    {
      type: 'object',
      name: 'durationWithSeconds',
      fields: [
        {name: 'duration', title: 'Duration (hh:mm:ss)', type: 'string'},
        {name: 'asSeconds', title: 'In seconds', type: 'number'}
      ],
      inputComponent: DurationWithSecondsInput
    }
  ]
}
