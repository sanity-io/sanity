import {
  Box,
  Checkbox,
  Flex,
  Inline,
  Radio,
  Select,
  Stack,
  Switch,
  Text,
  TextArea,
  TextInput,
} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {matrixBuilder, SchemeCompare} from '../../lib/matrixBuilder'

const meta: Meta = {
  title: 'UI v3 Primitives/Form',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Every Studio input is one of these raw controls plus a layer of composition. Reading ' +
            'the atom on its own separates a control defect from an input-composition defect: a ' +
            '`BooleanInput` is a `Switch` (or `Checkbox`) plus a `FormField`, a `StringInput` is ' +
            'a `TextInput` plus validation chrome.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `@sanity/ui` primitives: the toggle, choice, and text-entry controls |',
          '| Tier | ATOM. Wrapped by the Studio inputs in Forms & Input: `Switch`/`Checkbox` sit inside `BooleanInput`, `TextInput`/`TextArea` inside `StringInput`, `NumberInput`, `SlugInput`, `Select` inside `SelectInput` |',
          '| Audit | ⚪ not-audited as a unit; instances inherit whatever the consuming input’s audit found |',
          '| Patterns | `schema-driven-forms` |',
          '| States | enabled, disabled, read-only, plus a fourth for the toggles, indeterminate |',
          '',
          'Every control here reads across those states, and the toggles add indeterminate, the ' +
            '"not yet set" value a fresh boolean field shows before the editor touches it.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:schema-driven-forms',
    'source:sanity-ui',
    'tier:atom',
  ],
}

export default meta
type Story = StoryObj

const CONTROL_STATES = ['unchecked', 'checked', 'indeterminate'] as const
const AVAILABILITY = ['enabled', 'disabled', 'readOnly'] as const

/**
 * The pilot atom. `Switch` is the control inside Studio's **`BooleanInput`** when a boolean
 * field sets `options.layout: 'switch'`, see **Forms & Input → BooleanInput**, which wraps
 * this same atom in its own `FormField` header.
 *
 * The two playgrounds below are the finding. `Switch` paints its state from two sources: the
 * track colour follows the DOM `:checked` pseudo-class, the thumb position follows the React
 * `checked` prop. Left uncontrolled the track inverts on click and the thumb never moves, so
 * the control renders half-on and the two halves disagree about the value. Only the controlled
 * one behaves the way a real `BooleanInput` does.
 *
 * The matrix reads every value-state (rows) against every availability (columns). It is static
 * on purpose: `onChange={() => {}}` holds each cell at its labelled state so the table stays a
 * table. The indeterminate row is the one that only makes sense for a boolean: a field the
 * editor has not yet set is neither on nor off, and the switch shows a centered thumb to say so.
 */
function ControlledSwitch() {
  const [checked, setChecked] = useState(false)
  return <Switch checked={checked} onChange={() => setChecked((v) => !v)} />
}

export const SwitchPilot: Story = {
  name: 'Switch (pilot, inside BooleanInput)',
  render: () => (
    <Stack gap={5}>
      <Flex align="center" gap={3}>
        <Switch />
        <Text size={1} muted>
          Current, uncontrolled: click it. The track inverts, the thumb stays left.
        </Text>
      </Flex>
      <Flex align="center" gap={3}>
        <ControlledSwitch />
        <Text size={1} muted>
          Recommended, controlled: the thumb moves, which is the value the field would hold.
        </Text>
      </Flex>
      <SchemeCompare
        frame={false}
        render={(scheme) =>
          matrixBuilder({
            scheme,
            columns: AVAILABILITY,
            rows: CONTROL_STATES,
            title: 'Switch',
            renderItem: ({row, column}) => (
              <Flex key={`${row}-${column}`} align="center" justify="center">
                <Switch
                  checked={row === 'checked'}
                  indeterminate={row === 'indeterminate'}
                  disabled={column === 'disabled'}
                  readOnly={column === 'readOnly'}
                  onChange={() => {}}
                />
              </Flex>
            ),
          })
        }
      />
    </Stack>
  ),
}

/**
 * `Checkbox` is the same three-availability × value-state read as the switch, and the alternate
 * control `BooleanInput` renders for `options.layout: 'checkbox'`. The indeterminate box (a dash,
 * not a tick) is the unset boolean.
 */
export const CheckboxStates: Story = {
  name: 'Checkbox',
  render: () => (
    <SchemeCompare
      frame={false}
      render={(scheme) =>
        matrixBuilder({
          scheme,
          columns: AVAILABILITY,
          rows: CONTROL_STATES,
          title: 'Checkbox',
          renderItem: ({row, column}) => (
            <Flex key={`${row}-${column}`} align="center" justify="center">
              <Checkbox
                checked={row === 'checked'}
                indeterminate={row === 'indeterminate'}
                disabled={column === 'disabled'}
                readOnly={column === 'readOnly'}
                onChange={() => {}}
              />
            </Flex>
          ),
        })
      }
    />
  ),
}

/**
 * `Radio` is the single-choice control. It has no indeterminate state: a radio group is either
 * on one option or none, so the matrix drops that row and reads selected/unselected against
 * availability.
 */
export const RadioStates: Story = {
  name: 'Radio',
  render: () => (
    <SchemeCompare
      frame={false}
      render={(scheme) =>
        matrixBuilder({
          scheme,
          columns: AVAILABILITY,
          rows: ['unselected', 'selected'] as const,
          title: 'Radio',
          renderItem: ({row, column}) => (
            <Flex key={`${row}-${column}`} align="center" justify="center">
              <Radio
                name={`radio-${scheme}-${column}`}
                checked={row === 'selected'}
                disabled={column === 'disabled'}
                readOnly={column === 'readOnly'}
                onChange={() => {}}
              />
            </Flex>
          ),
        })
      }
    />
  ),
}

/**
 * `TextInput` is the single-line text atom under `StringInput`, `NumberInput`, `SlugInput`. Its
 * `fontSize` follows the Studio text scale; the real form uses `fontSize={2}` (15px), the size
 * these stories label. Type into the live field: uncontrolled, it holds its own text.
 */
export const TextInputStates: Story = {
  name: 'TextInput',
  render: () => (
    <Stack gap={5}>
      <Box style={{maxWidth: 320}}>
        <TextInput fontSize={2} placeholder="Live, type here" defaultValue="" />
      </Box>
      <SchemeCompare
        render={() => (
          <Stack gap={3} style={{minWidth: 240}}>
            {(
              [
                ['enabled', {}],
                ['with value', {value: 'Structured content', onChange: () => {}}],
                ['disabled', {disabled: true, value: 'Structured content', onChange: () => {}}],
                ['read-only', {readOnly: true, value: 'Structured content', onChange: () => {}}],
              ] as const
            ).map(([label, props]) => (
              <Stack key={label} gap={2}>
                <Text size={0} muted weight="semibold" style={{textTransform: 'capitalize'}}>
                  {label}
                </Text>
                <TextInput fontSize={2} placeholder="Placeholder" {...props} />
              </Stack>
            ))}
          </Stack>
        )}
      />
    </Stack>
  ),
}

/**
 * `TextArea` is the multi-line sibling of `TextInput`, the atom under a `text`-type
 * `StringInput`. Same availability read; the control grows to its `rows`.
 */
export const TextAreaStates: Story = {
  name: 'TextArea',
  render: () => (
    <SchemeCompare
      render={() => (
        <Stack gap={3} style={{minWidth: 280}}>
          {(
            [
              ['enabled', {rows: 3}],
              [
                'with value',
                {rows: 3, value: 'A longer body of structured content.', onChange: () => {}},
              ],
              [
                'read-only',
                {
                  rows: 3,
                  readOnly: true,
                  value: 'A longer body of structured content.',
                  onChange: () => {},
                },
              ],
            ] as const
          ).map(([label, props]) => (
            <Stack key={label} gap={2}>
              <Text size={0} muted weight="semibold" style={{textTransform: 'capitalize'}}>
                {label}
              </Text>
              <TextArea fontSize={2} placeholder="Placeholder" {...props} />
            </Stack>
          ))}
        </Stack>
      )}
    />
  ),
}

/**
 * `Select` is the native-backed dropdown under `SelectInput`. It owns its options list and, per
 * design law 7, keeps the browser's native menu inside the design surface rather than letting it
 * break through. Change the live one; the disabled and read-only reads sit beside it.
 */
export const SelectStates: Story = {
  name: 'Select',
  render: () => (
    <SchemeCompare
      render={() => (
        <Inline gap={3}>
          {(
            [
              ['enabled', {}],
              ['disabled', {disabled: true}],
              ['read-only', {readOnly: true}],
            ] as const
          ).map(([label, props]) => (
            <Stack key={label} gap={2} style={{minWidth: 120}}>
              <Text size={0} muted weight="semibold" style={{textTransform: 'capitalize'}}>
                {label}
              </Text>
              <Select fontSize={2} {...props}>
                <option>Draft</option>
                <option>In review</option>
                <option>Published</option>
              </Select>
            </Stack>
          ))}
        </Inline>
      )}
    />
  ),
}
