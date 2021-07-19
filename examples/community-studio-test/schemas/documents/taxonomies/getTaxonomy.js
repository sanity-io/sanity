import React from 'react';
import Icon from '../../components/icon';
import PathInput from '../../components/PathInput';

const TAXONOMY_TYPE_MAPPING = [
  {name: 'taxonomy.contributionType', title: 'type'},
  {name: 'taxonomy.framework', title: 'framework'},
  {name: 'taxonomy.category', title: 'cat'},
  {name: 'taxonomy.integration', title: 'integration'},
  {name: 'taxonomy.integrationType', title: 'intType'},
  {name: 'taxonomy.solution', title: 'solution'},
  {name: 'taxonomy.language', title: 'lang'},
];

/**
 * Common fields for taxonomies.
 * The reason we aren't using an object for this info is two-fold:
 * A) keep the data structure flat (document.title & document.seoDescription vs. document.meta.title)
 * B) allow for easier separation between taxonomies in the future.
 */
const getTaxonomyFields = ({type, includeSlug = true, includeIndexable = true} = {}) => {
  const fields = [
    {
      name: 'title',
      title: 'Title',
      description:
        '💡 make it clear and memorable for internal reference, this won\'t show up in the website.  For that, edit the "Title visible on page" field below',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
  ];

  if (includeSlug) {
    fields.push({
      name: 'slug',
      title: `Slug for this ${type}`,
      description:
        'Will be used to render paths for the community filters and navigation. Do not include slashes and other special characters',
      type: 'slug',
      inputComponent: PathInput,
      options: {
        basePath: `sanity.io/community/${
          TAXONOMY_TYPE_MAPPING.find((t) => t.name === `taxonomy.${type}`)?.title || type
        }=`,
        source: 'title',
      },
      validation: (Rule) => [
        Rule.required(),
        Rule.custom((value) => {
          const slug = value?.current || '';
          if (slug.includes('/') || slug.includes('\\')) {
            return 'Do not include slashes ("\\" or "/") in your slug';
          }
          if (slug.includes('=')) {
            return 'Do not include "=" in your slug';
          }
          if (slug.includes('&')) {
            return 'Do not include "&" in your slug';
          }
          return true;
        }),
      ],
    });
  }

  if (includeIndexable) {
    fields.push({
      name: 'indexable',
      title: `Is this ${type} indexable?`,
      description:
        "❓ Optional - we'll hide it from search engines by default. It's advisable to keep it non indexable until we have at least a handful of collaboration entries for it.",
      type: 'boolean',
    });
  }

  fields.push(
    {
      name: 'headerTitle',
      title: 'Title visible on page',
      description:
        "❓ Optional. If you don't provide any value here, we'll use the title above instead",
      type: 'string',
    },
    {
      name: 'headerBody',
      title: 'Rich text below the header title',
      description:
        '❓ Optional. Use this if you want to clarify or entice visitors about the current taxonomy',
      type: 'simpleBlockContent'
    },
    {
      name: 'seoTitle',
      title: 'Title for SEO',
      description:
        '⚡ Optional but highly encouraged to increase search engine rankings and conversion rates for this taxonomy',
      type: 'string',
      fieldset: 'seo',
    },
    {
      name: 'seoDescription',
      title: 'Description for SEO',
      description:
        '⚡ Optional but highly encouraged to increase search engine rankings and conversion rates for this taxonomy',
      type: 'string',
      fieldset: 'seo',
    },
    {
      name: 'ogImage',
      title: '📷 Social sharing image / open graph image',
      description:
        '⚡ Optional but highly encouraged to increase click rates in social media platforms',
      type: 'image',
      fieldset: 'seo',
      options: {
        storeOriginalFilename: false,
      },
    }
  );
  return fields;
};

/**
 * Generates a full-blown taxonomy schema
 */
export const getTaxonomySchema = ({
  includeSlug = true,
  includeIndexable = true,
  name,
  title,
  description,
  emoji,
  extraFields = [],
  preview: customPreview,
}) => {
  if (!name) {
    throw 'Taxonomy needs a name';
  }
  return {
    name: `taxonomy.${name}`,
    title,
    description,
    icon: emoji ? () => <Icon emoji={emoji} /> : null,
    type: 'document',
    fieldsets: [
      {
        name: 'seo',
        title: '🔍 SEO-related fields',
        options: {collapsible: true, collapsed: false},
      },
    ],
    fields: [...getTaxonomyFields({type: name, includeSlug, includeIndexable}), ...extraFields],
    initialValue: () => {
      if (includeIndexable) {
        return {
          indexable: false,
        };
      }
      return {};
    },
    preview: customPreview || {
      select: {
        title: 'title',
        ogImage: 'ogImage',
        indexable: 'indexable',
      },
      prepare(props) {
        return {
          title: props.title,
          subtitle: title || name,
          media: emoji ? <Icon emoji={emoji} /> : props.ogImage,
        };
      },
    },
  };
};
