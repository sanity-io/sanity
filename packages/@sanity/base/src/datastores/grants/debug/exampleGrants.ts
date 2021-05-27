import {DatasetGrants, Grant, DocumentPermissionName} from '../types'

const GRANTS: Record<DocumentPermissionName, Grant> = {
  read: {name: 'read', params: {}},
  update: {name: 'update', params: {}},
  create: {name: 'create', params: {}},
  history: {name: 'history', params: {}},
  editHistory: {name: 'editHistory', params: {}},
}

export const administrator: DatasetGrants = {
  'sanity.document.filter': [
    {
      grants: [GRANTS.read, GRANTS.create, GRANTS.history, GRANTS.update],
      config: {filter: '_id in path("**")'},
    },
  ],
}

export const editor: DatasetGrants = {
  'sanity.document.filter': [
    {
      grants: [GRANTS.read, GRANTS.create, GRANTS.history, GRANTS.update],
      config: {filter: '_id in path("**")'},
    },
  ],
}

export const developer: DatasetGrants = {
  'sanity.document.filter': [
    {
      grants: [GRANTS.read, GRANTS.create, GRANTS.history, GRANTS.update],
      config: {filter: '_id in path("**")'},
    },
  ],
}

export const contributor: DatasetGrants = {
  'sanity.document.filter': [
    {
      grants: [GRANTS.read],
      config: {filter: '_id in path("**")'},
    },
    {
      grants: [GRANTS.create, GRANTS.history, GRANTS.update],
      config: {filter: '_id in path("drafts.**")'},
    },
  ],
}

export const viewer: DatasetGrants = {
  'sanity.document.filter': [
    {
      grants: [GRANTS.read, GRANTS.history],
      config: {filter: '_id in path("**")'},
    },
  ],
}

// can only create documents of certain types
export const restricted: DatasetGrants = {
  'sanity.document.filter': [
    {
      grants: [GRANTS.read, GRANTS.create, GRANTS.history, GRANTS.update],
      config: {filter: '_id in path("drafts.**") && _type in ["stringsTest", "book", "author"]'},
    },
    {
      grants: [GRANTS.read],
      config: {filter: '_id in path("**")'},
    },
  ],
}
