import {render, screen} from '@testing-library/react'
import {type ComponentType, type PropsWithChildren} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {DocumentIdProvider} from '../../contexts/DocumentIdProvider'
import {type FieldMember} from '../../store'
import {
  FormCallbacksProvider,
  type FormCallbacksValue,
  type RenderArrayOfObjectsItemCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../studio'
import {DocumentFieldActionsProvider} from '../../studio/contexts/DocumentFieldActions'
import {MemberField} from './MemberField'

const EMPTY_ARRAY: never[] = []
const experimentalUnionMarker = '__experimental_union'

describe('MemberField', () => {
  it('renders standalone union fields through field and input callbacks', async () => {
    const {member, TestWrapper} = await setupTest()

    const renderField = vi.fn<RenderFieldCallback>((props) => (
      <div data-testid={`field-${props.inputId}`}>{props.children}</div>
    ))
    const renderInput = vi.fn<RenderInputCallback>((props) => (
      <div data-testid={`input-${props.id}`} />
    ))

    render(
      <MemberField
        member={member}
        renderField={renderField}
        renderInput={renderInput}
        renderItem={vi.fn<RenderArrayOfObjectsItemCallback>()}
        renderPreview={vi.fn<RenderPreviewCallback>()}
      />,
      {wrapper: TestWrapper},
    )

    expect(screen.getByTestId('field-one-of-many')).toBeInTheDocument()
    expect(screen.getByTestId('input-one-of-many')).toBeInTheDocument()
    expect(renderField).toHaveBeenCalledTimes(1)
    expect(renderInput).toHaveBeenCalledTimes(1)
  })
})

async function setupTest() {
  const schemaType = Object.assign(
    {
      name: 'oneOfMany',
      title: 'One of many object types',
      jsonType: 'object',
      unionKind: 'object',
      fields: [],
      of: [
        {name: 'hero', title: 'Hero', jsonType: 'object', fields: []},
        {name: 'callout', title: 'Callout', jsonType: 'object', fields: []},
      ],
    },
    {[experimentalUnionMarker]: true},
  )

  const member: FieldMember = {
    kind: 'field',
    key: 'key',
    name: 'oneOfMany',
    index: 0,
    collapsed: false,
    collapsible: false,
    open: true,
    groups: [],
    inSelectedGroup: false,
    field: {
      id: 'one-of-many',
      schemaType,
      level: 1,
      path: ['oneOfMany'],
      presence: [],
      validation: [],
      value: undefined,
      readOnly: false,
      focused: false,
      changed: false,
      hasUpstreamVersion: false,
      __unstable_computeDiff: vi.fn(),
    },
  }

  const formCallbacks: FormCallbacksValue = {
    onChange: vi.fn(),
    onPathFocus: vi.fn(),
    onPathBlur: vi.fn(),
    onPathOpen: vi.fn(),
    onSetPathCollapsed: vi.fn(),
    onSetFieldSetCollapsed: vi.fn(),
    onFieldGroupSelect: vi.fn(),
  }

  const BaseTestWrapper = await createTestProvider()

  const TestWrapper: ComponentType<PropsWithChildren> = ({children}) => (
    <BaseTestWrapper>
      <FormCallbacksProvider {...formCallbacks}>
        <DocumentIdProvider id="test">
          <DocumentFieldActionsProvider actions={EMPTY_ARRAY}>
            {children}
          </DocumentFieldActionsProvider>
        </DocumentIdProvider>
      </FormCallbacksProvider>
    </BaseTestWrapper>
  )

  return {member, formCallbacks, TestWrapper}
}
