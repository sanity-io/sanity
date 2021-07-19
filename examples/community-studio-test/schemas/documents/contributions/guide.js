import {BulbOutlineIcon} from '@sanity/icons';

import PathInput from '../../components/PathInput';
import {contributionInitialValue, getContributionTaxonomies} from './contributionUtils';

export default {
  name: 'contribution.guide',
  type: 'document',
  title: 'Guide',
  icon: BulbOutlineIcon,
  initialValue: contributionInitialValue,
  preview: {
    select: {
      title: 'title',
      hidden: 'hidden',
      type: '_type',
      media: 'image',
    },
    prepare: (selection) => {
      const {title, media, hidden, type} = selection;
      const result = {title, media};
      const sub = [type];
      if (hidden) {
        sub.push('hidden');
      }
      result.subtitle = `[${sub.join('] [')}]`;
      return result;
    },
  },
  fieldsets: [
    {
      name: 'external',
      title: '🌐 Additional content for guides hosted elsewhere',
      description: 'Add your guide’s external link so we can link to it.',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'internal',
      title: '📩 Additional content for Sanity.io hosted guides',
      description: 'If you’re publishing your guide to Sanity.io, this section is for you 😉',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      description:
        'A descriptive and enticing title will help your reader connect to the ideas you’re sharing.💡',
      validation: (Rule) => [
        Rule.required(),
        Rule.max(120).warning('Try to keep your Title under 120 characters.'),
      ],
    },
    {
      title: 'Summary',
      name: 'description',
      type: 'string',
      description:
        'Give your reader a hint of what they can learn 🔮. Summaries appear in small places like preview cards.',
      validation: (Rule) => [
        Rule.required(),
        Rule.max(300).warning('Try to keep your Summary under 300 characters.'),
      ],
    },
    {
      title: '👀 Hide this Guide?',
      name: 'hidden',
      type: 'boolean',
      description: 'Turn this on to stop your guide from being seen while you work on it.',
    },
    ...getContributionTaxonomies('guide', {
      solutions: {
        title: 'Categories',
        description: 'Connect your guide to common themes in the Sanity community.',
      },
      categories: {
        title: 'Categories',
        description:
          'Connect your guide to common themes in the Sanity community. Let us know if you have more great category ideas.',
      },
      frameworks: {
        title: 'Frameworks used',
        description:
          'If this guide relates to frameworks like Gatsby & Vue, make the connection so it appears as a resource for others who use the same frameworks as you. If your framework isn’t on this list get in touch.',
      },
      integrations: {
        title: 'Integrations & services used',
        description:
          'If your guide connects Sanity to other services, integrations, and APIs - make the connection. If you can’t find what you’re after get in touch.',
      },
      tools: {
        title: 'Sanity tools used',
        description: 'Add any Sanity tools & plugins you use, mention or reccommend in this guide.',
      },
    }),
    {
      name: 'authors',
      type: 'array',
      title: '👤 Author(s)',
      description: 'Credit yourself and others in the community who helped make this guide.',
      of: [
        {
          type: 'reference',
          to: [{type: 'person'}],
        },
      ],
    },
    {
      title: '📷  Main image',
      name: 'image',
      type: 'image',
      description:
        'Add a fun poster for preview cards. For best results upload at a minimum of 1200px wide by 750px high.',
      fields: [
        {
          title: 'Caption',
          name: 'caption',
          type: 'string',
          options: {
            isHighlighted: true,
          },
        },
        {
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          description: 'Alternative text for screenreaders. Falls back on caption if not set',
          options: {
            isHighlighted: true,
          },
        },
      ],
      options: {
        hotspot: true,
        storeOriginalFilename: false,
      },
    },
    {
      title: '📬 Guide slug',
      description:
        'This is the last part of your guide’s permalink. Please avoid special characters, spaces and uppercase letters.',
      name: 'slug',
      type: 'slug',
      fieldset: 'internal',
      required: true,
      inputComponent: PathInput,
      options: {
        basePath: 'sanity.io/guides',
        source: 'title',
        auto: true,
      },
    },
    {
      title: 'Guide introduction',
      name: 'introduction',
      fieldset: 'internal',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
        },
      ],
      description:
        'Longer than the Summary field. This field appears at the top of your guide page and explains the main ideas you’re sharing.',
    },
    {
      title: 'Canonical/alternative URL (for guides published elsewhere)',
      name: 'canonicalUrl',
      fieldset: 'internal',
      type: 'url',
      description:
        '💡 In case you published this content in your website, dev.to or some other medium, be sure to add the main URL you’d like search engines to index. If you don’t, Google and Bing may think you’re copying and pasting content from Sanity’s site and penalize your SEO rankings.',
    },
    {
      name: 'body',
      type: 'guideBody',
      fieldset: 'internal',
      title: 'Main content',
      description: 'Add the rest of your guide’s content and images here.',
    },
    {
      name: 'externalLink',
      type: 'url',
      title: 'External link',
      fieldset: 'external',
      // description:
      //  'If you published your guide elsewhere and don’t want to have a copy of it in the Sanity website, paste its URL here 😉',
    },
  ],
};
