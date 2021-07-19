import React from 'react';
import Icon from '../components/icon';
import PathInput from '../components/PathInput';
import userAvatarPreview from '../components/userAvatarPreview';

const SOCIAL_MEDIA = [
  {
    title: 'Github',
    prefix: 'https://github.com',
  },
  {
    title: 'Twitter',
    prefix: 'https://twitter.com',
  },
  {
    title: 'LinkedIn',
    prefix: 'https://www.linkedin.com/in',
  },
  {
    title: 'Dev.to',
    prefix: 'https://dev.to',
  },
];

export default {
  name: 'person',
  title: 'Person',
  type: 'document',
  icon: () => <Icon emoji="👤" />,
  initialValue: {
    hidden: true,
  },
  fields: [
    {
      name: 'name',
      title: 'Your name',
      type: 'string',
    },
    {
      name: 'hidden',
      type: 'boolean',
      title: 'Hide my profile?',
      description:
        'Turn this on if you don’t yet want to appear in sanity.io/community/people/{your-handle}',
    },
    {
      name: 'handle',
      title: 'Your handle in the Sanity community',
      description:
        'This will define your profile’s unique URL. Please void special characters, spaces and uppercase letters.',
      type: 'slug',
      inputComponent: PathInput,
      options: {
        basePath: 'sanity.io/community/people',
        source: 'title',
      },
      validation: (Rule) => [
        Rule.required('Please provide a handle for your profile'),
        // Rule.unique("There's another person with this handle, please choose another"),
      ],
    },
    {
      name: 'photo',
      title: 'Your photo',
      description:
        'Your avatar for use in the community website. Upload something larger than 440px x 440px to ensure it looks great on all devices.',
      type: 'image',
      options: {
        storeOriginalFilename: false,
        // @TODO: try to remove the option to add images from the library
        // sources: []
      },
    },
    {
      name: 'headline',
      type: 'string',
      title: 'Short bio',
      description:
        'This usually appears next to your name. Keep it short and the point, you have more room to in your Long bio below.',
      validation: (Rule) => [
        Rule.required(),
        Rule.max(120).warning('Try to keep your Headline under 120 characters.'),
      ],
    },
    {
      name: 'bio',
      type: 'simpleBlockContent',
      title: 'Long bio',
      // @TODO: provide examples and instructions here?
      description:
        'Tell others what you’re passionate about, and how Sanity relates to what you do.',
    },
    {
      name: 'expertise',
      title: 'Areas of expertise',
      description:
        'Let others know what types of work you love to do with Sanity. Choose up to 10 that are most relevant to you.',
      type: 'array',
      of: [
        {
          type: 'reference',
          title: 'Expertise categories',
          to: [{type: 'taxonomy.category'}],
          options: {
            filter: '$type in applicableTo',
            filterParams: {
              type: 'person',
            },
          },
        },
      ],
      validation: (Rule) => [Rule.max(10).error('Add up to 10 entries.'), Rule.unique()],
    },
    {
      name: 'tech',
      title: 'Tech you’re familiar with',
      description: 'Frameworks and services/integrations that you use on a regular basis.',
      type: 'array',
      of: [
        {
          type: 'reference',
          title: 'Frameworks & integrations',
          description: "Get in touch if you don't find the language you were looking for",
          to: [
            {
              type: 'taxonomy.integration',
            },
            {
              type: 'taxonomy.framework',
            },
          ],
        },
      ],
    },
    // @TODO: consider removing this field - depends on signup callback (see api/callback.ts)
    {
      name: 'imageUrl',
      type: 'url',
      title: 'User avatar',
      inputComponent: userAvatarPreview,
      hidden: true,
    },
    {
      name: 'location',
      type: 'string',
      title: 'Location',
      description:
        'Let others know where you’re based. It could be your country, city/country, or state/country',
    },
    {
      name: 'usesSanitySince',
      type: 'date',
      title: 'When did you first start working with Sanity?',
      description:
        "You don't have to worry about getting the day or month right, just pick a date close to when you remember starting your first Sanity project.",
      options: {
        dateFormat: 'MMMM YYYY',
      },
    },
    {
      name: 'url',
      type: 'url',
      title: 'Personal URL',
      description:
        'Your personal website or home online. You can can add social links and your company’s URL in the "Work" fields below',
    },
    {
      name: 'email',
      type: 'email',
      title: 'Public contact email',
      description:
        "This email will be shown in your public profile - leave it empty if you don't want others to know it.",
    },
    {
      name: 'work',
      type: 'object',
      title: 'Work',
      options: {collapsible: true, collapsed: false},
      fields: [
        {
          name: 'title',
          title: 'Job title',
          type: 'string',
        },
        {
          name: 'company',
          title: 'Company name',
          type: 'string',
          description: 'Name of your workplace, your own company, or "Freelance" etc.',
        },
        {
          name: 'url',
          title: 'Company URL',
          description: 'Freelancer? Paste in your website or favorite social media.',
          type: 'url',
        },
        {
          name: 'availableForWork',
          title: 'Available for work?',
          description: 'Turn this on if you’d like others to contact you about work opportunities',
          type: 'boolean',
        },
      ],
    },
    {
      name: 'social',
      type: 'object',
      title: 'Social links',
      options: {collapsible: true, collapsed: false},
      description:
        "All of these are optional. Include only your handle or profile ID - or paste the full URL and we'll format it.",
      fields: SOCIAL_MEDIA.map((vendor) => ({
        name: vendor.title.toLowerCase().replace('.', ''),
        title: vendor.title,
        type: 'string',
        inputComponent: PathInput,
        options: {
          basePath: vendor.prefix,
          customFormat: (value) => {
            // We want a RegExp that will capture https, http and plain domain versions of vendor.prefix
            // Ex: https://github.com (vendor.prefix) => (https?:\/\/)?github.com
            const regEx = new RegExp('(https?://)?' + vendor.prefix.split('https://')[1], 'gm');
            return value.toLowerCase().replace(regEx, '').replace('/', '');
          },
        },
      })),
    },
    {
      name: 'slackId',
      title: 'Sanity Slack member ID',
      type: 'string',
      description:
        'To get your ID, open the Slack client, click on your profile picture on the top-right corner, "View profile", "More" on the sidebar that appears and then "Copy member ID". Questions? Reach out on the Slack #help channel :)',
    },
    {
      name: 'allowSlackRelation',
      title: 'Can we link your questions and answers in Slack to your Sanity.io profile?',
      description:
        "This way, helpful threads you've participated in will include your name and add more visibility to your profile. Don't feel obliged, though, Slack is a closed space and we get it if you don't feel comfortable sharing a part of what you wrote there in Sanity's website.",
      type: 'boolean',
    },
    {
      name: 'spotlightQuestion',
      title: 'How has Sanity changed your practice?',
      description:
        "What has it enabled you to do, what are your favorite features or whatever else you want to tell us. We'll show your answer in the community home's \"Contributor Spotlight\" section - we haven't figured out the mechanism for choosing who will appear there, though, so feel free to skip this or reach out with your great ideas.",
      type: 'simpleBlockContent',
    },
    // @TODO: remove these fields, I think they don't apply anymore 🤔
    {
      name: 'sanityId',
      title: 'Sanity ID',
      type: 'string',
      description: 'Added automatically on document creation.',
      readonly: true,
      hidden: true,
    },
    {
      name: 'github',
      title: 'GitHub username',
      type: 'string',
      description: 'Added by Auth0.',
      readonly: true,
      hidden: true,
    },
  ],
  preview: {
    select: {
      title: 'name',
      handle: 'handle.current',
      media: 'photo',
    },
    prepare({title, handle, media}) {
      return {
        title,
        media,
        subtitle: handle ? `@${handle}` : 'No handle set',
      };
    },
  },
};
