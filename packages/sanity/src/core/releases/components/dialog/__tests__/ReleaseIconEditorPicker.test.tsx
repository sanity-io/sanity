import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  ReleaseIconEditorPicker,
  type ReleaseIconEditorPickerValue,
} from '../ReleaseIconEditorPicker'

vi.mock('sanity', () => {
  return {
    SANITY_VERSION: '0.0.0',
    useTranslation: vi.fn().mockReturnValue({t: vi.fn()}),
  }
})

describe('BundleIconEditorPicker', () => {
  const onChangeMock = vi.fn()
  const valueMock: ReleaseIconEditorPickerValue = {
    hue: 'gray',
    icon: 'cube',
  }

  beforeEach(async () => {
    onChangeMock.mockClear()

    const wrapper = await createTestProvider()
    render(<ReleaseIconEditorPicker onChange={onChangeMock} value={valueMock} />, {wrapper})
  })

  it('should render the icon picker button', () => {
    const iconPickerButton = screen.getByTestId('icon-picker-button')
    expect(iconPickerButton).toBeInTheDocument()
  })

  it('should open the popover when the icon picker button is clicked', () => {
    const iconPickerButton = screen.getByTestId('icon-picker-button')
    fireEvent.click(iconPickerButton)
    const popoverContent = screen.getByTestId('popover-content')
    expect(popoverContent).toBeInTheDocument()
  })

  it('should call onChange with the selected hue when a hue button is clicked', () => {
    const iconPickerButton = screen.getByTestId('icon-picker-button')
    fireEvent.click(iconPickerButton)
    const hueButton = screen.getByTestId('hue-button-magenta')
    fireEvent.click(hueButton)
    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, hue: 'magenta'})
  })

  it('should call onChange with the selected icon when an icon button is clicked', () => {
    const iconPickerButton = screen.getByTestId('icon-picker-button')
    fireEvent.click(iconPickerButton)
    const iconButton = screen.getByTestId('icon-button-circle')
    fireEvent.click(iconButton)
    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, icon: 'circle'})
  })
})
