export default {
  name: 'crewMember',
  title: 'Crew Member',
  type: 'object',
  fields: [
    {
      name: 'department',
      title: 'Department',
      type: 'string'
    },
    {
      name: 'job',
      title: 'Job',
      type: 'string'
    },
    {
      name: 'person',
      title: 'Person',
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
      type: 'string'
    }
  ],
  preview: {
    select: {
      name: 'person.name',
      job: 'job',
      department: 'department',
      imageUrl: 'person.image.asset.url'
    },
    prepare(selection) {
      const {name, job, department, imageUrl} = selection
      return {
        title: name,
        subtitle: `${job} [${department}]`,
        imageUrl: imageUrl
      }
    }
  }
}
