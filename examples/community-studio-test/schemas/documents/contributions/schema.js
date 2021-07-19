import {CodeBlockIcon} from '@sanity/icons';

import PathInput from '../../components/PathInput';
import {contributionInitialValue, getContributionTaxonomies} from './contributionUtils';

export default {
  name: 'contribution.schema',
  type: 'document',
  title: 'Schema',
  icon: CodeBlockIcon,
  initialValue: contributionInitialValue,
  preview: {
    select: {
      title: 'title',
      subtitle: '_type',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title of your schema',
      description:
        "This will be reader's first impression, so remember to make it descriptive and enticing :)",
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: '📬 relative address in the community site',
      description: '💡 avoid special characters, spaces and uppercase letters.',
      type: 'slug',
      inputComponent: PathInput,
      options: {
        basePath: 'sanity.io/schemas',
        source: 'title',
        isUnique: () => true,
      },
      validation: (Rule) => Rule.optional(),
      // This is auto-generated in the publish action
      hidden: true,
    },
    {
      title: 'Headline / short description for the schema',
      name: 'description',
      type: 'string',
      description:
        'Hints what it can be used for. This shows up in the preview card for the schema.',
    },
    ...getContributionTaxonomies('schema', {
      solutions: {
        title: 'Categories',
        description: 'Connect your schema to common themes in the Sanity community.',
      },
      categories: {
        title: 'Categories',
        description:
          'Connect your schema to common themes in the Sanity community. Let us know if you have more great category ideas.',
      },
      // @TODO: find a way to restrict this field only to tools that are studio plugins. Previously when we were using category we could reference those tools pointing to studio plugin, but now we'll need to get inventive
      // tools: {
      //   title: 'Any studio plugin this schema uses?',
      //   description:
      //     'Browse for tools, plugins, asset sources, SDKs and others that you are used, mentioned or suggested by this guide.',
      // },
    }),
    {
      name: 'authors',
      type: 'array',
      title: '👤 Author(s)',
      description: 'Credit yourself and others in the community who helped make this schema.',
      of: [
        {
          type: 'reference',
          to: [{type: 'person'}],
        },
      ],
    },
    {
      name: 'schemaFiles',
      title: 'Schema code files',
      description:
      'Paste in the contents of all the related schema files from your Sanity studio repo.',
      type: 'array',
      of: [
        {
          type: 'schemaEntryObj',
        },
      ],
    },
    {
      title: 'Deeper explanation of the schema',
      description:
        'Tell others what’s interesting about these files, and the purpose they’re intended to serve. Usability tips also appreciated by those who might extend on what you’ve made.',
      name: 'body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
        },
      ],
    },
  ],
};
