export const branch = {
  type: 'document',
  name: 'branch',
  fields: [
    {name: 'name', type: 'string'},
    {
      name: 'lastCommit',
      type: 'object',
      fields: [
        {name: 'author', type: 'string'},
        {name: 'message', type: 'string'},
        {name: 'sha', type: 'string'},
        {name: 'user', type: 'string'},
      ],
    },
  ],
  preview: {
    fields: {
      name: 'name',
      message: 'lastCommit.message',
      author: 'lastCommit.author',
    },
    prepare({name, message, author}) {
      return {
        title: `${name}`,
        subtitle: `${message} (${author})`,
      }
    },
  },
}
