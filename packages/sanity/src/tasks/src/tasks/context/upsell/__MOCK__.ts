import {type UpsellData} from '../../../../../structure/comments'

export const TASKS_UPSELL_MOCK: UpsellData = {
  _updatedAt: '2024-04-03T08:28:40Z',
  image: {
    asset: {
      url: 'https://cdn.sanity.io/images/pyrmmpch/upsell-public-development/4972c12da8183d3089257c5c101d00319d3a108b-1520x720.png',
      altText: null,
    },
  },
  _createdAt: '2024-01-28T18:56:24Z',
  _rev: '1017a00b-544f-4776-96c5-aae6049e4951',
  _type: 'upsellUI',
  descriptionText: [
    {
      _type: 'block',
      style: 'normal',
      _key: '98f981fe4395',
      markDefs: [],
      children: [
        {
          _type: 'span',
          marks: [],
          text: '',
          _key: '4c370ea7133c',
        },
        {
          _key: 'd4c7dba88d0b',
          accent: true,
          sanityIcon: 'bolt',
          _type: 'inlineIcon',
          icon: null,
        },
        {
          _type: 'span',
          marks: ['accent', 'semibold'],
          text: 'Upgrade to unlock',
          _key: '024e4826efc6',
        },
      ],
    },
    {
      markDefs: [],
      children: [
        {
          _type: 'span',
          marks: [],
          text: 'Get it done together with Tasks',
          _key: '97d6db4fec8b',
        },
      ],
      _type: 'block',
      style: 'h2',
      _key: '83acf1002fe7',
    },
    {
      style: 'normal',
      _key: 'e712c5856ad6',
      markDefs: [],
      children: [
        {
          _type: 'span',
          marks: [],
          text: 'Tasks lets you create reminders for yourself and your team. Set due dates. Clarify with comments. Track task history. Get notified about changes.',
          _key: '5cdc03d577f30',
        },
      ],
      _type: 'block',
    },
  ],
  ctaButton: {
    text: 'Upgrade plan',
    url: 'https://{{baseUrl}}/manage/project/{{projectId}}/plan',
  },
  secondaryButton: {
    text: 'Learn more',
    url: 'https://www.sanity.io/docs/tasks',
  },
  _id: 'c8eafe14-d994-43a3-933c-67370a8bd334',
  id: 'tasks-upsell',
}
