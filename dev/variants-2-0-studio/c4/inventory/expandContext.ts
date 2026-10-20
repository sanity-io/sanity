import {createContext, useContext} from 'react'

/**
 * LIVE: what the panel header's expand control does. Andrej's prototype names it "Open in Variants tool" and does not wire it.
 * In the studio it is the ONE expand of the version inventory: it opens the C5 document lens in a dialog. The host provides
 * the handler (the inspector and the popover); without one the control is inert, as in his prototype.
 */
export const InventoryExpandContext = createContext<(() => void) | null>(null)
export const useInventoryExpand = () => useContext(InventoryExpandContext)
