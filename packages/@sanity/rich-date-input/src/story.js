import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import RichDateInput from 'part:@sanity/form-builder/input/rich-date'
import {withKnobs, boolean, text, number} from 'part:@sanity/storybook/addons/knobs'

storiesOf('Date Picker', module)
  .addDecorator(withKnobs)
  .add('Default', () => {
    const dateFormat = text('dateFormat', 'YYYY-MM-DD')
    const timeFormat = text('timeFormat', 'HH:mm')
    const inputUtc = boolean('inputUtc', false)
    const timeStep = number('timeStep', 15)
    const calendarTodayLabel = text('calendarTodayLabel', 'Today')
    const placeholderDate = text('placeholderDate')
    const placeholderTime = text('placeholderTime')
    const inputDate = boolean('inputDate', true)
    const inputTime = boolean('inputTime', true)

    const options = {
      dateFormat,
      timeFormat,
      inputUtc,
      timeStep,
      calendarTodayLabel,
      placeholderDate,
      placeholderTime,
      inputDate,
      inputTime,
    }

    return (
      <RichDateInput
        onChange={action('onChange')}
        type={{
          title: text('title'),
          description: text('description'),
          options: options,
        }}
      />
    )
  })
