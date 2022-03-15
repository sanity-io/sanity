export default {
  name: 'button',
  title: 'Button',
  type: 'object',
  fields: [
    {
      name: 'buttonText',
      title: 'Text',
      type: 'string',
    },
    {
      name: 'buttonAction',
      title: 'Action',
      type: 'string',
      options: {
        list: [
          {
            title: 'Cancel',
            value: 'cancel',
          },
          {
            title: 'Submit',
            value: 'submit',
          },
        ],
      },
    },
  ],
}
