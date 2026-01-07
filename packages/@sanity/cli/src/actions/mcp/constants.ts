import {existsSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import execa from 'execa'

export type EditorName =
  | 'Cursor'
  | 'VS Code'
  | 'VS Code Insiders'
  | 'Claude Code'
  | 'Zed'
  | 'OpenCode'

export const MCP_SERVER_URL = 'https://mcp.sanity.io'

export const NO_EDITORS_DETECTED_MESSAGE = `Couldn't auto-configure Sanity MCP server for your editor. Visit ${MCP_SERVER_URL} for setup instructions.`

export interface EditorConfig {
  configKey: string
  /** Returns the config file path if editor is detected, null otherwise */
  detect: () => Promise<string | null>
  buildServerConfig: (token: string) => Record<string, unknown>
}

const defaultHttpConfig = (token: string) => ({
  type: 'http',
  url: MCP_SERVER_URL,
  headers: {Authorization: `Bearer ${token}`},
})

const homeDir = os.homedir()

/**
 * Centralized editor configuration including detection logic.
 * To add a new editor: add an entry here with a detect function.
 */
export const EDITOR_CONFIGS: Record<EditorName, EditorConfig> = {
  'Cursor': {
    configKey: 'mcpServers',
    detect: async () => {
      const cursorDir = path.join(homeDir, '.cursor')
      return existsSync(cursorDir) ? path.join(cursorDir, 'mcp.json') : null
    },
    buildServerConfig: defaultHttpConfig,
  },
  'VS Code': {
    configKey: 'servers',
    detect: async () => {
      let configDir: string | null = null
      switch (process.platform) {
        case 'darwin':
          configDir = path.join(homeDir, 'Library/Application Support/Code/User')
          break
        case 'win32':
          if (process.env.APPDATA) {
            configDir = path.join(process.env.APPDATA, 'Code/User')
          }
          break
        default:
          configDir = path.join(homeDir, '.config/Code/User')
      }
      return configDir && existsSync(configDir) ? path.join(configDir, 'mcp.json') : null
    },
    buildServerConfig: defaultHttpConfig,
  },
  'VS Code Insiders': {
    configKey: 'servers',
    detect: async () => {
      let configDir: string | null = null
      switch (process.platform) {
        case 'darwin':
          configDir = path.join(homeDir, 'Library/Application Support/Code - Insiders/User')
          break
        case 'win32':
          if (process.env.APPDATA) {
            configDir = path.join(process.env.APPDATA, 'Code - Insiders/User')
          }
          break
        default:
          configDir = path.join(homeDir, '.config/Code - Insiders/User')
      }
      return configDir && existsSync(configDir) ? path.join(configDir, 'mcp.json') : null
    },
    buildServerConfig: defaultHttpConfig,
  },
  'Claude Code': {
    configKey: 'mcpServers',
    detect: async () => {
      try {
        await execa('claude', ['--version'], {stdio: 'pipe', timeout: 5000})
        return path.join(homeDir, '.claude.json')
      } catch {
        return null
      }
    },
    buildServerConfig: defaultHttpConfig,
  },
  'Zed': {
    configKey: 'context_servers',
    detect: async () => {
      let configDir: string | null = null
      switch (process.platform) {
        case 'win32':
          if (process.env.APPDATA) {
            configDir = path.join(process.env.APPDATA, 'Zed')
          }
          break
        default:
          configDir = path.join(homeDir, '.config/zed')
      }
      return configDir && existsSync(configDir) ? path.join(configDir, 'settings.json') : null
    },
    buildServerConfig: (token) => ({
      url: MCP_SERVER_URL,
      headers: {Authorization: `Bearer ${token}`},
      settings: {},
    }),
  },
  'OpenCode': {
    configKey: 'mcp',
    detect: async () => {
      try {
        await execa('opencode', ['--version'], {stdio: 'pipe', timeout: 5000})
        return path.join(homeDir, '.config/opencode/opencode.json')
      } catch {
        return null
      }
    },
    buildServerConfig: (token) => ({
      type: 'remote',
      url: MCP_SERVER_URL,
      headers: {Authorization: `Bearer ${token}`},
    }),
  },
}
