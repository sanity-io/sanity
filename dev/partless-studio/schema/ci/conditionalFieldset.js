export default {
  name: 'conditionalFieldset',
  title: 'Conditional fieldset',
  type: 'document',
  fieldsets: [
    //Multi hidden
    {
      name: 'multiHiddenBooleanTrue',
      title: 'multiHiddenBooleanTrue',
      hidden: true,
    },
    {
      name: 'multiHiddenBooleanFalse',
      title: 'multiHiddenBooleanFalse',
      hidden: false,
    },
    {
      name: 'multiHiddenCallbackTrue',
      title: 'multiHiddenCallbackTrue',
      hidden: ({document}) => document.hidden === true,
    },
    {
      name: 'multiHiddenCallbackFalse',
      title: 'Fieldset hidden callback false',
      hidden: ({document}) => document.hidden === 'asdf',
    },
    // Single hidden
    {
      name: 'singleHiddenBooleanTrue',
      title: 'singleHiddenBooleanTrue',
      hidden: true,
    },
    {
      name: 'singleHiddenBooleanFalse',
      title: 'singleHiddenBooleanFalse',
      hidden: false,
    },
    {
      name: 'singleHiddenCallbackTrue',
      title: 'singleHiddenCallbackTrue',
      hidden: ({document}) => document.hidden === true,
    },
    {
      name: 'singleHiddenCallbackFalse',
      title: 'Fieldset hidden callback false',
      hidden: ({document}) => document.hidden === 'asdf',
    },
    //Multi read only
    {
      name: 'multiReadOnlyBooleanTrue',
      title: 'multiReadOnlyBooleanTrue',
      readOnly: true,
    },
    {
      name: 'multiReadOnlyBooleanFalse',
      title: 'multiReadOnlyBooleanFalse',
      readOnly: false,
    },
    {
      name: 'multiReadOnlyCallbackTrue',
      title: 'multiReadOnlyCallbackTrue',
      readOnly: ({document}) => Boolean(document.readOnly === true),
    },
    {
      name: 'multiReadOnlyCallbackFalse',
      title: 'multiReadOnlyCallbackFalse',
      readOnly: ({document}) => Boolean(document.readOnly === 'asdf'),
    },
    //Single read only
    {
      name: 'singleReadOnlyBooleanTrue',
      title: 'singleReadOnlyBooleanTrue',
      readOnly: true,
    },
    {
      name: 'singleReadOnlyBooleanFalse',
      title: 'singleReadOnlyBooleanFalse',
      readOnly: false,
    },
    {
      name: 'singleReadOnlyCallbackTrue',
      title: 'singleReadOnlyCallbackTrue',
      readOnly: ({document}) => Boolean(document.readOnly === true),
    },
    {
      name: 'singleReadOnlyCallbackFalse',
      title: 'singleReadOnlyCallbackFalse',
      readOnly: ({document}) => Boolean(document.readOnly === 'asdf'),
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'hidden',
      title: 'Hidden',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'readOnly',
      title: 'Read only',
      type: 'boolean',
      initialValue: true,
    },
    //Multi hidden
    {
      fieldset: 'multiHiddenBooleanTrue',
      name: 'multiHiddenBooleanTrue1',
      title: 'multiHiddenBooleanTrue1',
      type: 'string',
    },
    {
      fieldset: 'multiHiddenBooleanTrue',
      name: 'multiHiddenBooleanTrue2',
      title: 'multiHiddenBooleanTrue2',
      type: 'string',
    },
    {
      fieldset: 'multiHiddenBooleanFalse',
      name: 'multiHiddenBooleanFalse1',
      title: 'multiHiddenBooleanFalse1',
      type: 'string',
    },
    {
      fieldset: 'multiHiddenBooleanFalse',
      name: 'multiHiddenBooleanFalse2',
      title: 'multiHiddenBooleanFalse2',
      type: 'string',
    },
    {
      fieldset: 'multiHiddenCallbackTrue',
      name: 'multiHiddenCallbackTrue1',
      title: 'multiHiddenCallbackTrue1',
      type: 'string',
    },
    {
      fieldset: 'multiHiddenCallbackTrue',
      name: 'multiHiddenCallbackTrue2',
      title: 'multiHiddenCallbackTrue2',
      type: 'string',
    },
    {
      fieldset: 'multiHiddenCallbackFalse',
      name: 'multiHiddenCallbackFalse1',
      title: 'multiHiddenCallbackFalse1',
      type: 'string',
    },
    {
      fieldset: 'multiHiddenCallbackFalse',
      name: 'multiHiddenCallbackFalse2',
      title: 'multiHiddenCallbackFalse2',
      type: 'string',
    },
    // Single hidden
    {
      fieldset: 'singleHiddenBooleanTrue',
      name: 'singleHiddenBooleanTrue1',
      title: 'singleHiddenBooleanTrue1',
      type: 'string',
    },
    {
      fieldset: 'singleHiddenBooleanFalse',
      name: 'singleHiddenBooleanFalse1',
      title: 'singleHiddenBooleanFalse1',
      type: 'string',
    },
    {
      fieldset: 'singleHiddenCallbackTrue',
      name: 'singleHiddenCallbackTrue1',
      title: 'singleHiddenCallbackTrue1',
      type: 'string',
    },
    {
      fieldset: 'singleHiddenCallbackFalse',
      name: 'singleHiddenCallbackFalse1',
      title: 'singleHiddenCallbackFalse1',
      type: 'string',
    },
    //Multi read only
    {
      fieldset: 'multiReadOnlyBooleanTrue',
      name: 'multiReadOnlyBooleanTrue1',
      title: 'multiReadOnlyBooleanTrue1',
      type: 'string',
    },
    {
      fieldset: 'multiReadOnlyBooleanTrue',
      name: 'multiReadOnlyBooleanTrue2',
      title: 'multiReadOnlyBooleanTrue2',
      type: 'string',
    },
    {
      fieldset: 'multiReadOnlyBooleanFalse',
      name: 'multiReadOnlyBooleanFalse1',
      title: 'multiReadOnlyBooleanFalse1',
      type: 'string',
    },
    {
      fieldset: 'multiReadOnlyBooleanFalse',
      name: 'multiReadOnlyBooleanFalse2',
      title: 'multiReadOnlyBooleanFalse2',
      type: 'string',
    },
    {
      fieldset: 'multiReadOnlyCallbackTrue',
      name: 'multiReadOnlyCallbackTrue1',
      title: 'multiReadOnlyCallbackTrue1',
      type: 'string',
    },
    {
      fieldset: 'multiReadOnlyCallbackTrue',
      name: 'multiReadOnlyCallbackTrue2',
      title: 'multiReadOnlyCallbackTrue2',
      type: 'string',
    },
    {
      fieldset: 'multiReadOnlyCallbackFalse',
      name: 'multiReadOnlyCallbackFalse1',
      title: 'multiReadOnlyCallbackFalse1',
      type: 'string',
    },
    {
      fieldset: 'multiReadOnlyCallbackFalse',
      name: 'multiReadOnlyCallbackFalse2',
      title: 'multiReadOnlyCallbackFalse2',
      type: 'string',
    },
    // Single read only
    {
      fieldset: 'singleReadOnlyBooleanTrue',
      name: 'singleReadOnlyBooleanTrue1',
      title: 'singleReadOnlyBooleanTrue1',
      type: 'string',
    },
    {
      fieldset: 'singleReadOnlyBooleanFalse',
      name: 'singleReadOnlyBooleanFalse1',
      title: 'singleReadOnlyBooleanFalse1',
      type: 'string',
    },
    {
      fieldset: 'singleReadOnlyCallbackTrue',
      name: 'singleReadOnlyCallbackTrue1',
      title: 'singleReadOnlyCallbackTrue1',
      type: 'string',
    },
    {
      fieldset: 'singleReadOnlyCallbackFalse',
      name: 'singleReadOnlyCallbackFalse1',
      title: 'singleReadOnlyCallbackFalse1',
      type: 'string',
    },
  ],
}
