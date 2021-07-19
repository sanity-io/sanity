import {PlugIcon} from '@sanity/icons';

import brandColorList from '../../../src/utils/brandColorList';
import PathInput from '../../components/PathInput';
import {contributionInitialValue, getContributionTaxonomies} from './contributionUtils';

export default {
  name: 'contribution.tool',
  type: 'document',
  title: 'Plugin or tool',
  icon: PlugIcon,
  initialValue: contributionInitialValue,
  fieldsets: [
    {
      name: 'code',
      title: 'Source code',
      description: 'Complete these to let others review your repo and use what you made.',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'visuals',
      title: 'Main image',
      description: 'Give your tool a memorable image and background for display.',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      description:
        'Briefly explain what your tool does, and how it can help others in the community.',
      type: 'text',
      rows: 1,
      validation: (Rule) => [
        Rule.required(),
        Rule.max(300).warning('Try to keep your Description under 300 characters.'),
      ],
    },
    {
      name: 'slug',
      title: 'Relative address in the community site',
      description: 'Please avoid special characters, spaces and uppercase letters.',
      type: 'slug',
      inputComponent: PathInput,
      options: {
        basePath: 'sanity.io/plugins',
        source: 'title',
      },
      validation: (Rule) => Rule.required(),
    },
    ...getContributionTaxonomies('tool', {
      solutions: {
        title: 'Categories',
        description: 'Connect your tool to common themes in the Sanity community.',
      },
      categories: {
        title: 'Categories',
        description: 'Connect your tool to common themes in the Sanity community.',
      },
      frameworks: {
        title: 'Frameworks used',
        description:
          'If this tool relates to a framework like Gatsby & Vue, make the connection for others who also use it. If you can’t find your framework get in touch.',
      },
      integrations: {
        title: 'Integrations & services used',
        description:
          'If your tool connects Sanity to other services and APIs. If you can’t find what you’re after get in touch.',
      },
    }),
    {
      name: 'authors',
      type: 'array',
      title: '👤 Author(s)',
      description:
        'Credit yourself and others with a profile in the Sanity community who helped make this tool.',
      of: [
        {
          type: 'reference',
          to: [{type: 'person'}],
        },
      ],
    },
    {
      name: 'image',
      type: 'image',
      title: 'Logo / Icon',
      description:
        'Upload an image related to your tool for easy identification. SVG or transparent PNG logos work great. 300px x 300px for bitmap files if you can.',
      fieldset: 'visuals',
      options: {
        hotspot: true,
        storeOriginalFilename: false,
      },
    },
    {
      name: 'repositoryUrl',
      type: 'url',
      title: 'Git repository URL',
      description: 'The repository where this code is stored.',
      fieldset: 'code',
    },
    {
      name: 'readmeUrl',
      type: 'url',
      title: 'Raw README URL',
      description: "We need this to display contents from your tool's README.md in the Sanity site",
      validation: (Rule) => Rule.required(),
      fieldset: 'code',
    },
    {
      name: 'packageUrl',
      type: 'url',
      title: 'Package URL',
      description:
        'If your tool lives in a public package directory like NPM, Crates, or Composer – list it here for others.',
      fieldset: 'code',
    },
    // @TODO: does it make sense to provide install commands for npm packages? Such as `npm i metalsmith-sanity`, which isn't applicable to the Sanity studio.
    {
      name: 'installWith',
      type: 'string',
      title: 'Installation command (for studio plugins)',
      description: 'E.g. "sanity install media". Only applicable to plugins.',
      fieldset: 'code',
    },
    // Hidden fields populated automatically
    {
      name: 'readme',
      title: 'Readme',
      description: 'Populated from the readme URL above',
      type: 'markdown',
      hidden: true,
    },
  ],
};
