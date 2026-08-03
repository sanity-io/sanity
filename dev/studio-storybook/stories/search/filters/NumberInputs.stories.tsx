import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SearchFilterNumberInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/number/Number'
import {SearchFilterNumberRangeInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/number/NumberRange'
import {type OperatorNumberRangeValue} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/definitions/operators/common'
import {
  FilterInputFrame,
  OperatorInputStory,
  WithFilterProviders,
} from '../../../lib/searchFilterHarness'

const meta: Meta = {
  title: 'Search/Filter Inputs/Number',
  decorators: [WithFilterProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'Number-shaped filters share two value controls: a single numeric box for the ' +
            'comparison operators, and a two-box range input for is-between. The same pair also ' +
            'serves the array-count family, since counting items in an array collapses to the ' +
            'same comparisons once the field resolves to a number.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `.../search/components/filters/filter/inputs/number/` |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '',
          '> **Why it matters:** both inputs are uncontrolled, each keeps its own raw string in ' +
            'local state so the box can hold an empty string, a bare minus sign, or a trailing ' +
            'decimal point mid-keystroke, and only calls back with a finite number or nothing. ' +
            'The range input takes that a step further: its two bounds are independent state, so ' +
            'one bound can be typed while the other sits untouched, and each keystroke reads the ' +
            "other bound off the last-committed value rather than the sibling input's local " +
            'state.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
}

export default meta
type Story = StoryObj

export const NumberEmpty: Story = {
  name: 'Number, empty',
  parameters: {
    docs: {
      description: {
        story:
          'The resting state of `numberEqual`, `numberGt`, `numberGte`, `numberLt`, `numberLte` and `numberNotEqual`. Emits `null` until a finite number is typed - `parseFloat` on an empty or partial string (`""`, `"-"`) is `NaN`, which the component treats the same as no value rather than passing `NaN` downstream into a GROQ filter.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory input={SearchFilterNumberInput} fieldPath="readingTime" />
    </FilterInputFrame>
  ),
}

export const NumberFilled: Story = {
  name: 'Number, filled',
  parameters: {
    docs: {
      description: {
        story:
          'The same control carrying a value. Edit it and watch the emitted value follow - note it tracks the field as a bare number (`8`, not `"8"`), which is what lets `numberGt`\'s `groqFilter` interpolate it directly into `readingTime > 8` without a cast.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterNumberInput}
        fieldPath="readingTime"
        initialValue={8}
      />
    </FilterInputFrame>
  ),
}

export const NumberFullscreen: Story = {
  name: 'Number, full-screen sizing',
  parameters: {
    docs: {
      description: {
        story:
          'The same component inside a full-screen search. It reads `state.fullscreen` and ' +
          'steps its font size up (`fontSize={fullscreen ? 2 : 1}`), the same convention ' +
          '`SearchFilterStringInput` follows. It is easy to assume only the string family does ' +
          'this.',
      },
    },
  },
  render: () => (
    <FilterInputFrame fullscreen>
      <OperatorInputStory
        input={SearchFilterNumberInput}
        fieldPath="readingTime"
        initialValue={8}
      />
    </FilterInputFrame>
  ),
}

export const NumberRangeEmpty: Story = {
  name: 'Number range, empty',
  parameters: {
    docs: {
      description: {
        story:
          'The resting state of `numberRange`. Both bounds start at `""` in local state; the operator emits `null` until it has a `value` at all, and its `groqFilter` only produces a filter once both `from` and `to` are finite - a range with one bound set is a real, reachable UI state that still does not compile into a query. See "partially filled" below.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory input={SearchFilterNumberRangeInput} fieldPath="readingTime" />
    </FilterInputFrame>
  ),
}

export const NumberRangeFilled: Story = {
  name: 'Number range, filled',
  parameters: {
    docs: {
      description: {
        story:
          "Both bounds set. `numberRange`'s `groqFilter` reads this as `readingTime > 5 && readingTime < 20` - note the operators are strict (`>`/`<`, not `>=`/`<=`), so a range does not include its own endpoints. That is a property of the operator definition, not this input, but it only becomes visible once you can see what the input actually emits.",
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterNumberRangeInput}
        fieldPath="readingTime"
        initialValue={{from: 5, to: 20} as OperatorNumberRangeValue}
      />
    </FilterInputFrame>
  ),
}

export const NumberRangePartial: Story = {
  name: 'Number range, partially filled',
  parameters: {
    docs: {
      description: {
        story:
          'One bound set, the other left at `null`. This is not a hypothetical edge case - ' +
          '`handleFromChange` and `handleToChange` each write their own key of the value object ' +
          'independently and default the other to `value?.to ?? null` / `value?.from ?? null`, ' +
          'so a user who fills in only "from" produces exactly this shape. `numberRange`\'s ' +
          "`groqFilter` returns `''` (not `null`) for it, which shows up if you are inspecting " +
          'emitted filter strings rather than the value object.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterNumberRangeInput}
        fieldPath="readingTime"
        initialValue={{from: 5, to: null} as OperatorNumberRangeValue}
      />
    </FilterInputFrame>
  ),
}

export const ArrayCount: Story = {
  name: 'Array count, reusing the number input',
  parameters: {
    docs: {
      description: {
        story:
          "`arrayCountGt`, `arrayCountGte`, `arrayCountLt`, `arrayCountLte`, `arrayCountEqual` and `arrayCountNotEqual` all point `inputComponent` at this exact `SearchFilterNumberInput` - there is no separate array-count input. The operator's `groqFilter` is the only thing that changes shape, wrapping the field in `count(...)` (`count(tags) > 2`) instead of comparing it directly. `arrayCountRange` does the same with `SearchFilterNumberRangeInput`. Pointed at `tags` here to show the reuse against an actual array field rather than a number field.",
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory input={SearchFilterNumberInput} fieldPath="tags" initialValue={2} />
    </FilterInputFrame>
  ),
}
