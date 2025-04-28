import {type DocumentActionDescription} from 'sanity'

export function CustomAction(): DocumentActionDescription {
  return {
    label: 'Custom Action',
    onHandle: () => null,
  }
}
