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
      type: 'string'
    },
    {
      name: 'externalCreditId',
      title: 'External Credit ID',
      type: 'string'
    },
  ],
  preview: {
    select: {
      name: 'person.name',
      job: 'job',
      department: 'department'
    },
    prepare(selection) {
      const {name, job, department} = selection
      return {
        title: name,
        subtitle: `${job} [${department}]`
      }
    }
  }
}
