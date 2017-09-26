// @flow
export type Type = {
  type: any,
  name: string,
  title: string,
  description: string,
  readOnly: ?boolean,
  options: {
    editModal: 'fold' | 'modal',
    sortable: boolean,
    layout?: 'grid'
  },
  of: Array<Type>
}

export type TransferStatus = {
  progress: number
}

export type ItemValue = {
  _type?: string,
  _key: string,
  _transferStatus?: TransferStatus
}
