
export type Type = {
  type: any,
  name: string,
  title: string,
  description: string,
  readOnly: ?boolean,
  options: {
    editModal: 'fold' | 'modal',
    sortable: boolean
  },
  of: Array<Type>
}

export type ItemValue = {
  _type: string,
  _key: string
}
