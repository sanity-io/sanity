import React from 'react';
import Icon from '../components/icon';
import TagPicker from '../components/tagPicker';
import OpenInSlack from '../components/openInSlack';
import statuses from '../inputs/statuses';
import actions from '../inputs/actions';
import {getContributionTaxonomies} from './contributions/contributionUtils';
import PathInput from '../components/PathInput';

export default {
  type: 'document',
  name: 'ticket',
  title: 'Ticket',
  icon: () => <Icon emoji="🎫" />,
  fieldsets: [
    {
      name: 'editorial',
      title: 'Editorial fields for showing this ticket in the website',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: [
    {
      title: 'Permalink',
      type: 'url',
      name: 'permalink',
      readOnly: true,
      inputComponent: OpenInSlack,
    },
    {
      title: 'Summary',
      type: 'text',
      name: 'summary',
      rows: 5,
      description: 'An short description of what the question actually is about.',
    },
    {
      title: 'Status',
      type: 'string',
      name: 'status',
      options: {
        list: statuses,
        layout: 'radio',
        direction: 'horizontal',
      },
    },
    {
      title: 'Next action',
      type: 'string',
      name: 'action',
      options: {
        list: actions,
        layout: 'radio',
        direction: 'horizontal',
      },
    },
    {
      title: 'Tags',
      type: 'array',
      name: 'tags',
      of: [{type: 'tag'}],
      options: {
        layout: 'tags',
      },
      inputComponent: TagPicker,
    },
    {
      name: 'solvedWith',
      type: 'object',
      title: 'Solved with…',
      description: 'How did we solve this issue? (Optional)',
      fields: [
        {
          name: 'url',
          type: 'url',
          title: 'URL',
          description: 'URL to documentation page, GitHub, demo, etc.',
        },
        {
          name: 'summary',
          type: 'text',
          title: 'Summary',
          rows: 5,
          description: 'Write a short summary if you want to elaborate more.',
        },
      ],
    },
    {
      title: 'Agent',
      name: 'assigned',
      type: 'reference',
      weak: false,
      to: [{type: 'person'}],
    },
    {
      title: 'Channel name',
      type: 'string',
      name: 'channelName',
      readOnly: true,
    },
    {
      title: 'Author name',
      type: 'string',
      name: 'authorName',
      readOnly: true,
    },
    {
      title: 'Opened by',
      type: 'string',
      name: 'openedBy',
      readOnly: true,
    },
    {
      title: 'Thread',
      type: 'array',
      name: 'thread',
      of: [{type: 'message'}],
      readOnly: true,
    },
    {
      name: 'relevancy',
      title: 'How relevant is this ticket for the sanity.io website?',
      description:
        'Will people extract value from finding this answer in Google and in the website today, tomorrow and a year from now?',
      type: 'number',
      options: {
        list: [
          {value: 0, title: "Won't help future users (don't index)"},
          {value: 25, title: 'Helps with edge cases (findable through Google)'},
          {value: 50, title: 'Answers a common problem (visible in the UI)'},
          {value: 100, title: 'Vital answer (highlighted in search and UI)'},
        ],
        layout: 'radio',
      },
      fieldset: 'editorial',
    },
    {
      name: 'editorialTitle',
      title: 'Title to show up in the sanity.io site (if relevant)',
      description: "⚡ Optional but highly encouraged. We'll fallback to summary, but you can use this to make the question more surfaceable and search-ready.",
      type: 'text',
      rows: 1,
      fieldset: 'editorial',
    },
    {
      name: 'featured',
      title: 'Is this thread featured?',
      type: 'boolean',
      fieldset: 'editorial',
    },
    ...getContributionTaxonomies(undefined, {
      solutions: {
        title: 'Related solutions',
      },
      frameworks: {
        title: 'Related frameworks',
      },
      integrations: {
        title: 'Related integrations/services',
      },
      tools: {
        title: 'Related community tools & plugins',
      },
    }).map((field) => ({...field, fieldset: 'editorial'})),
    {
      name: 'slug',
      title: '📬 relative address in the community site',
      description: '💡 avoid special characters, spaces and uppercase letters.',
      type: 'slug',
      inputComponent: PathInput,
      options: {
        basePath: 'sanity.io/help',
        source: 'title',
        isUnique: () => true,
      },
      validation: (Rule) => Rule.optional(),
      fieldset: 'editorial',
      // This is auto-generated in the publish action
      hidden: true,
    },
  ],
  initialValue: {
    status: 'open',
    action: 'none',
  },
  preview: {
    select: {
      channelName: 'channelName',
      status: 'status',
      summary: 'summary',
      tags: 'tags',
      firstMessage: 'thread.0.content',
      thread: 'thread',
    },
    prepare({channelName, status, summary, tags, firstMessage, thread}) {
      const tagsList =
        tags !== undefined ? `${tags.map((t) => t.value).join(', ')}` : '[missing tags]';
      const label = status !== 'resolved' ? <Icon emoji="🎫" /> : <Icon emoji="✅" />;

      const regex = /[^\/]+\/([a-zA-Z0-9]+).*/;
      const pathSegment = window.location.pathname && regex.exec(window.location.pathname)[1];

      let altLabel = <Icon emoji="🗣️" />;
      if (pathSegment == 'alerts') {
        if (status !== 'resolved') {
          if (thread[1] == undefined) {
            altLabel = <Icon emoji="🥖" />;
          }
          if (thread[25]) {
            altLabel = <Icon emoji="🔥" />;
          }
        } else {
          altLabel = <Icon emoji="🕰️" />;
        }
      }
      return {
        title: summary || firstMessage,
        subtitle: `${channelName && `#${channelName}`}, ${tagsList}`,
        media: pathSegment == 'alerts' ? altLabel : label,
      };
    },
  },
};
