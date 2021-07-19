import React from 'react';
import contributions from '.';
import Icon from '../../components/icon';

export default {
  name: 'curatedContribution',
  title: 'Curated contribution',
  icon: () => <Icon emoji="👌" />,
  description:
    'References a community contribution and adds extra fields to them to allow for administrative curation of content. The goal is not to curfew and block the community members, but rather provide a way to filter offensive, agressive and other behaviors not conformant with our code of conduct.',
  type: 'document',
  fields: [
    {
      name: 'contribution',
      title: 'Contribution',
      type: 'reference',
      readOnly: true,
      to: contributions.map((type) => ({
        type: type.name,
      })),
      // This is necessary to allow members to delete their creations
      weak: true
    },
    {
      name: 'official',
      title: 'Is this contribution official?',
      description: 'Default is false',
      type: 'boolean',
    },
    {
      name: 'approved',
      title: 'Approved',
      description: 'Should this contribution go live? Make sure it complies to our code of conduct ;)',
      type: 'boolean',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'featured',
      title: 'Featured',
      description: 'Default is false',
      type: 'boolean',
    },
    {
      name: 'cameFromAdmin',
      title: 'Was this ported over from the admin studio?',
      description: 'This will eventually be deprecated',
      readOnly: true,
      type: 'boolean',
    },
    {
      name: 'solutions',
      title: 'Solutions related to this contribution',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'taxonomy.solution'}]}],
    },
    // @TODO: consider referencing related to other curatedContribution instead of the contribution itself
    {
      title: '🔗 Contributions related to this',
      description:
        'Know of other community contributions that could help users after consuming the current one? Feel free to plug them here :)',
      name: 'related',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: contributions.map((type) => ({
            type: type.name,
          })),
        },
      ],
    },
    {
      name: 'relatedTitle',
      title: 'Title for the related section',
      description: '💡 if you added related contributions above, you can customize the heading shown above them to explain to readers why that\'s relevant.',
      type: 'string',
    },
    // @TODO: relatedCta to send users to another page?
  ],
  preview: {
    select: {
      official: 'official',
      approved: 'approved',
      featured: 'featured',
      contributionType: 'contribution._type',
      contributionTitle: 'contribution.title',
      solutions: 'solutions',
      related: 'related',
    },
    prepare(props) {
      const subtitleParts = [];
      let icon;
      if (props.contributionType) {
        subtitleParts.push(props.contributionType.replace('contribution.', ''));
      }
      if (props.official) {
        subtitleParts.push('🔒 Official');
      }
      if (props.featured) {
        subtitleParts.push('🌟 featured');
      }
      if (Array.isArray(props.solutions)) {
        subtitleParts.push(`${props.solutions.length} solution(s)`);
      }
      if (Array.isArray(props.related)) {
        subtitleParts.push(`related to ${props.related.length}`);
      }
      if (props.approved) {
        // subtitleParts.push('✅ Approved');
        icon = () => <Icon emoji="✅" />;
      } else if (typeof props.approved === 'undefined') {
        // subtitleParts.push('⌛ Pending');
        icon = () => <Icon emoji="⌛" />;
      } else if (props.approved === false) {
        // subtitleParts.push('❌ Denied');
        icon = () => <Icon emoji="❌" />;
      }
      return {
        title: props.contributionTitle || 'No contribution chosen',
        subtitle: subtitleParts.join(' - '),
        media: icon || undefined,
      };
    },
  },
};
