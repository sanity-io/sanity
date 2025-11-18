import {Box, Card, Text} from '@sanity/ui'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'decorationFields',
  type: 'document',
  fields: [
    // @ts-expect-error - This field has no default components, so it will use the default input component which shows a warning. We are testing that the warning is shown.
    defineField({
      name: 'noDefaultComponents',
      type: 'formDecoration',
      title: 'No default components',
      description:
        'This field has no default components, so it will use the default input component which shows a warning.',
    }),
    defineField({
      name: 'withInput',
      type: 'formDecoration',
      title: 'With defined input',
      description:
        'This field has a defined input component, so it will use that one instead of the warning',
      components: {
        input: () => (
          <Box paddingY={2}>
            <Text size={1}>Using form decorator input component</Text>
          </Box>
        ),
      },
    }),
    defineField({
      name: 'withFieldAndInput',
      type: 'formDecoration',
      title: 'With defined field and input',
      components: {
        field: (props) => (
          <Card padding={2} border tone="primary">
            {props.renderDefault(props)}
          </Card>
        ),
        input: () => (
          <Card padding={2} border>
            <Box padding={2}>
              <Text size={1}>Using form decorator input component</Text>
            </Box>
          </Card>
        ),
      },
    }),
  ],
})
