import {type ArraySchemaType} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render} from '@testing-library/react'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type ArrayOfPrimitivesInputProps} from '../../../types/inputProps'
import {ArrayOfPrimitivesInput} from './ArrayOfPrimitivesInput'

vi.mock('../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('./arrayOfPrimitiveUploadTarget', () => ({
  UploadTargetCard: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))

vi.mock('../../../../changeIndicators/ChangeIndicator', () => ({
  ChangeIndicator: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))

const arrayOfPrimitivesItemMock = vi.fn((_props: Record<string, unknown>) => null)
vi.mock('../../../members/array/items/ArrayOfPrimitivesItem', () => ({
  ArrayOfPrimitivesItem: (props: Record<string, unknown>) => arrayOfPrimitivesItemMock(props),
}))

function createSchemaType(): ArraySchemaType {
  return {
    name: 'testArray',
    jsonType: 'array',
    of: [{name: 'string', jsonType: 'string', type: {name: 'string', jsonType: 'string'}}],
  } as ArraySchemaType
}

describe('ArrayOfPrimitivesInput', () => {
  beforeEach(() => {
    arrayOfPrimitivesItemMock.mockClear()
  })

  it('passes the form renderItem callback through to each primitive member', () => {
    const renderItem = vi.fn()
    const member = {
      kind: 'item',
      key: 'string-0',
      index: 0,
      item: {path: [0], value: 'hello'},
    }
    const props = {
      schemaType: createSchemaType(),
      members: [member],
      renderInput: vi.fn(),
      renderItem,
      elementProps: {id: 'test', onFocus: vi.fn(), onBlur: vi.fn(), ref: {current: null}},
      validation: [],
      changed: false,
      onUpload: vi.fn(),
      onItemRemove: vi.fn(),
      resolveUploader: vi.fn(),
      onIndexFocus: vi.fn(),
    } as unknown as ArrayOfPrimitivesInputProps

    render(<ArrayOfPrimitivesInput {...props} />, {
      wrapper: ({children}: {children: ReactNode}) => (
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
      ),
    })

    expect(arrayOfPrimitivesItemMock).toHaveBeenCalledTimes(1)
    expect(arrayOfPrimitivesItemMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        member,
        renderItem,
      }),
    )
  })
})
