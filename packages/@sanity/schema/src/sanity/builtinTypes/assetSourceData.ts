export default {
  name: 'sanity.assetSourceData',
  title: 'Asset Source Data',
  type: 'object',
  fields: [
    {
      name: 'name',
      title: 'Source name',
      description: 'A canonical name for the source this asset is originating from',
      type: 'string',
    },
    {
      name: 'id',
      title: 'Asset Source ID',
      description:
        'The unique ID for the asset within the originating source so you can programatically find back to it',
      type: 'string',
    },
    {
      name: 'url',
      title: 'Asset information URL',
      description: 'A URL to find more information about this asset in the originating source',
      type: 'string',
    },
  ],
}
