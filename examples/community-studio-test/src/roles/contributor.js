/**
 * This is the base group settings for the contributors role
 */
export default {
  _id: '_.groups.contributor',
  _type: 'system.group',
  grants: [
    {
      path: '*',
      permissions: ['read'],
    },
    {
      path: '**',
      permissions: ['history'],
    },
    {
      path: 'stats.**',
      permissions: ['read'],
    },
    {
      filter: '_type match "contribution.*"',
      permissions: ['create'],
    },
    {
      filter: 'identity() in authors[]._ref',
      permissions: ['read', 'create', 'update'],
    },
    {
      filter: '_type == "person"',
      permissions: ['read'],
    },
    {
      filter: '_id == identity()',
      permissions: ['read', 'create', 'update'],
    },
    {
      filter: '_id == "drafts." + identity()',
      permissions: ['read', 'create', 'update'],
    },
    {
      filter: '_type in ["sanity.fileAsset", "sanity.imageAsset"]',
      permissions: ['read', 'create', 'update'],
    },
  ],
  members: [],
};
