import {afterEach, describe, expect, it, vi} from 'vitest'

// We need to control the module-level `consumeSessionId` side effect,
// so we mock `window.location.hash` before importing the module.

describe('sessionId', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('hasSessionId', () => {
    it('should return true when a session ID is present without consuming it', async () => {
      // Set up hash with a session ID before module loads
      const originalHash = window.location.hash
      Object.defineProperty(window, 'location', {
        value: {...window.location, hash: '#sid=test-session-id-1234567890'},
        writable: true,
        configurable: true,
      })

      // Use dynamic import to get a fresh module with the session ID consumed at load time
      vi.resetModules()
      const {hasSessionId, getSessionId} = await import('../sessionId')

      // hasSessionId should return true without consuming
      expect(hasSessionId()).toBe(true)
      expect(hasSessionId()).toBe(true) // Still true - not consumed

      // Now consume it
      const sid = getSessionId()
      expect(sid).toBe('test-session-id-1234567890')

      // Now hasSessionId should return false
      expect(hasSessionId()).toBe(false)

      // Restore
      Object.defineProperty(window, 'location', {
        value: {...window.location, hash: originalHash},
        writable: true,
        configurable: true,
      })
    })
  })
})
