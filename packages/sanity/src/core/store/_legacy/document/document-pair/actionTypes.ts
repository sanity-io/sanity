import {type PatchMutation} from '@sanity/types'

export interface HttpCreateAction {
  actionType: 'sanity.action.document.create'
  publishedId: string
  attributes: {
    _id: string
    _type: string
  }
  ifExists: 'ignore' | 'fail'
}

export interface HttpDeleteAction {
  actionType: 'sanity.action.document.delete'
  draftId: string
  publishedId: string
}

export interface HttpEditAction {
  actionType: 'sanity.action.document.edit'
  draftId: string
  publishedId: string
  patch: PatchMutation['patch']
}

export type HttpAction = HttpCreateAction | HttpDeleteAction | HttpEditAction
