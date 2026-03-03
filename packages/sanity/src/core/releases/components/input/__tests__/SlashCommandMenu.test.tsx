import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {act, useEffect, useRef} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {SlashCommandMenu, type SlashCommand, type SlashCommandMenuHandle} from '../SlashCommandMenu'

const BoldIcon = () => <span>B</span>
const ItalicIcon = () => <span>I</span>
const UnderlineIcon = () => <span>U</span>

const mockCommands: SlashCommand[] = [
  {key: 'bold', label: 'Bold', icon: BoldIcon},
  {key: 'italic', label: 'Italic', icon: ItalicIcon},
  {key: 'underline', label: 'Underline', icon: UnderlineIcon},
]

interface TestMenuProps {
  commands?: SlashCommand[]
  handleHolderRef: {current: SlashCommandMenuHandle | null}
  onSelect?: (command: SlashCommand) => void
}

function TestMenu(props: TestMenuProps) {
  const {commands, handleHolderRef, onSelect} = props
  const ref = useRef<SlashCommandMenuHandle>(null)

  useEffect(() => {
    handleHolderRef.current = ref.current
  })

  return (
    <div style={{height: '400px', position: 'relative'}}>
      <SlashCommandMenu
        commands={commands ?? mockCommands}
        inputElement={null}
        onSelect={onSelect ?? vi.fn()}
        ref={ref}
      />
    </div>
  )
}

async function renderMenu(
  props: Partial<{
    commands: SlashCommand[]
    onSelect: (command: SlashCommand) => void
  }> = {},
) {
  const handleHolderRef: {current: SlashCommandMenuHandle | null} = {current: null}

  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  const result = render(<TestMenu {...props} handleHolderRef={handleHolderRef} />, {wrapper})

  return {
    ...result,
    handleHolderRef,
  }
}

describe('SlashCommandMenu', () => {
  beforeEach(() => {
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight',
    )
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    )

    // Virtual list needs element sizes to render items
    // https://github.com/TanStack/virtual/issues/641
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return 800
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return 800
      },
    })

    return () => {
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
      }
      if (originalOffsetWidth) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth)
      }
    }
  })

  it('renders all commands when search term is empty', async () => {
    await renderMenu()

    await waitFor(() => {
      expect(screen.getByText('Bold')).toBeInTheDocument()
    })
    expect(screen.getByText('Italic')).toBeInTheDocument()
    expect(screen.getByText('Underline')).toBeInTheDocument()
  })

  it('filters commands by search term', async () => {
    const {handleHolderRef} = await renderMenu()

    await waitFor(() => {
      expect(screen.getByText('Bold')).toBeInTheDocument()
    })

    act(() => {
      handleHolderRef.current?.setSearchTerm('bo')
    })

    await waitFor(() => {
      expect(screen.queryByText('Italic')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Bold')).toBeInTheDocument()
    expect(screen.queryByText('Underline')).not.toBeInTheDocument()
  })

  it('calls onSelect when a command is clicked', async () => {
    const onSelect = vi.fn()
    await renderMenu({onSelect})

    await waitFor(() => {
      expect(screen.getByText('Bold')).toBeInTheDocument()
    })

    const boldButton = screen.getByText('Bold').closest('button')!
    await userEvent.click(boldButton)

    expect(onSelect).toHaveBeenCalledWith(mockCommands[0])
  })
})
