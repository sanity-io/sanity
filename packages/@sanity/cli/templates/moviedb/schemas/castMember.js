export default {
  name: 'castMember',
  title: 'Cast Member',
  type: 'object',
  fields: [
    {
      name: 'characterName',
      title: 'Character Name',
      type: 'string'
    },
    {
      name: 'person',
      title: 'Actor',
      type: 'reference',
      to: [{type: 'person'}]
    },
    {
      name: 'externalId',
      title: 'External ID',
      type: 'number'
    },
    {
      name: 'externalCreditId',
      title: 'External Credit ID',
      type: 'number'
    }
  ],
  preview: {
    fields: {
      characterName: 'characterName',
      name: 'person.name'
    },
    prepare(selection) {
      const {characterName, name} = selection
      return {
        title: name,
        subtitle: characterName
      }
    }
  }

}
