import React from 'react'
import {defineType} from 'sanity'
import {
  BooleanFieldDiff,
  BooleanFieldDiffProps,
  NumberFieldDiff,
  NumberFieldDiffProps,
  SlugFieldDiff,
  SlugFieldDiffProps,
  StringFieldDiff,
  StringFieldDiffProps,
} from 'sanity/_unstable'

function CustomStringDiff(props: StringFieldDiffProps) {
  return (
    <div data-testid="custom-string-diff">
      <StringFieldDiff {...props} />
    </div>
  )
}

function CustomNumberDiff(props: NumberFieldDiffProps) {
  return (
    <div data-testid="custom-number-diff">
      <NumberFieldDiff {...props} />
    </div>
  )
}

function CustomBooleanDiff(props: BooleanFieldDiffProps) {
  return (
    <div data-testid="custom-boolean-diff">
      <BooleanFieldDiff {...props} />
    </div>
  )
}

function CustomSlugDiff(props: SlugFieldDiffProps) {
  return (
    <div data-testid="custom-slug-diff">
      <SlugFieldDiff {...props} />
    </div>
  )
}

export const reviewChanges = defineType({
  type: 'document',
  name: 'reviewChanges',
  title: 'Review changes',
  fields: [
    // String
    {
      type: 'string',
      name: 'stringWithDefaultDiffComponent',
      title: 'String with default diff component',
    },
    {
      type: 'string',
      name: 'stringWithCustomDiffComponent',
      title: 'Number with custom diff component',
      components: {
        diff: CustomStringDiff,
      },
    },
    {
      type: 'string',
      name: 'stringWithRenderDiffComponent',
      title: 'String with render diff component',
    },
    // Number
    {
      type: 'number',
      name: 'numberWithDefaultDiffComponent',
      title: 'Number with default diff component',
    },
    {
      type: 'number',
      name: 'numberWithCustomDiffComponent',
      title: 'Number with custom diff component',
      components: {
        diff: CustomNumberDiff,
      },
    },
    {
      type: 'number',
      name: 'numberWithRenderDiffComponent',
      title: 'Number with render diff component',
    },
    // Boolean
    {
      type: 'boolean',
      name: 'booleanWithDefaultDiffComponent',
      title: 'boolean with default diff component',
    },
    {
      type: 'boolean',
      name: 'booleanWithCustomDiffComponent',
      title: 'Boolean with custom diff component',
      components: {
        diff: CustomBooleanDiff,
      },
    },
    {
      type: 'boolean',
      name: 'booleanWithRenderDiffComponent',
      title: 'Boolean with render diff component',
    },
    // Slug
    {
      type: 'slug',
      name: 'slugWithDefaultDiffComponent',
      title: 'Slug with default diff component',
    },
    {
      type: 'slug',
      name: 'slugWithCustomDiffComponent',
      title: 'Slug with custom diff component',
      components: {
        diff: CustomSlugDiff,
      },
    },
    {
      type: 'slug',
      name: 'slugWithRenderDiffComponent',
      title: 'Slug with render diff component',
    },
  ],
})
