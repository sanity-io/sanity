import {ImageIcon} from '@sanity/icons';

import PathInput from '../../components/PathInput';
import {contributionInitialValue, getContributionTaxonomies} from './contributionUtils';

export default {
  name: 'contribution.showcaseProject',
  type: 'document',
  title: 'Project for the showcase',
  icon: ImageIcon,
  initialValue: contributionInitialValue,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Project name',
    },
    {
      name: 'description',
      title: 'Headline / short description for the project',
      description:
        "Use this space to explain briefly what the project is. You'll have room for details in the in-depth explanation field below :)",
      type: 'text',
      rows: 1,
    },
    {
      name: 'url',
      type: 'url',
      title: 'URL to access it',
      description: "If you don't have a public URL, feel free to leave this empty",
    },
    {
      name: 'slug',
      title: '📬 relative address in the community site',
      description: '💡 avoid special characters, spaces and uppercase letters.',
      type: 'slug',
      inputComponent: PathInput,
      options: {
        basePath: 'sanity.io/projects',
        source: 'title',
      },
      validation: (Rule) => Rule.required(),
    },
    ...getContributionTaxonomies('showcaseProject', {
      solutions: {
        title: 'Categories',
        description: 'Connect your project to common themes in the Sanity community.',
      },
      categories: {
        title: 'Category(ies)',
        description: "Get in touch if you don't find the category you were looking for",
      },
      frameworks: {
        title: 'Frameworks used',
        description:
          'If your project was build with a framework like Gatsby & Vue, make the connection so it appears as a resource for others who use the same framework as you. If your framework isn’t on this list get in touch.',
      },
      integrations: {
        title: 'Integrations & services used',
        description:
          'If you connected Sanity to other services, integrations, and APIs - make the connection. If you can’t find what you’re after get in touch.',
      },
      tools: {
        title: 'Sanity tools used',
        description: 'Add any Sanity tools & plugins you used in this project.',
      },
    }),
    {
      name: 'authors',
      title: '👤 Author(s)',
      type: 'array',
      description: 'Credit yourself and others in the community who helped make this project.',
      of: [
        {
          type: 'reference',
          to: [
            {
              type: 'person',
            },
          ],
        },
      ],
    },
    {
      name: 'image',
      type: 'image',
      title: 'Main image for this project',
      description:
        'This image will be featured in the card for this project, in the initial section of your project page, and for sharing links in social media.',
      options: {
        hotspot: true,
        storeOriginalFilename: false,
      },
    },
    {
      name: 'projectScreenshots',
      type: 'array',
      title: 'Screenshots of the project',
      description:
        'Not to be confused with screenshots of your project’s Sanity studio. There’s room for those in the next field.',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
            storeOriginalFilename: false,
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              options: {
                isHighlighted: true,
              },
            },
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
              description:
                "Help people who for any reason can't download or see the image by providing a descriptive text about what it contains 😇",
              options: {
                isHighlighted: true,
              },
            },
          ],
        },
      ],
      options: {
        layout: 'grid',
      },
      validation: (Rule) => [Rule.unique()],
    },
    {
      name: 'studioScreenshots',
      type: 'array',
      title: 'Sanity Studio Screenshots',
      description:
        'Some suggestions for what to screenshot: your desk structure; the dashboard and other tools installed; your most interesting schema, etc.',
      of: [
        {
          type: 'studioImage',
        },
      ],
      options: {
        layout: 'grid',
      },
      validation: (Rule) => [Rule.unique()],
    },
    {
      title: 'In-depth explanation of the project',
      name: 'body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
        },
      ],
      description:
        'Let others know about the challenges you faced, the solutions , and what you learned along the way.',
    },
  ],
  preview: {
    select: {
      media: 'image',
      title: 'title',
      subtitle: 'url',
    },
  },
};
