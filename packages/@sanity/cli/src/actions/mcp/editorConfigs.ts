import {existsSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import execa from 'execa'

import {MCP_SERVER_URL} from './constants'

export interface EditorConfig {
  buildServerConfig: (token: string) => Record<string, unknown>
  configKey: string
  /** Returns the config file path if editor is detected, null otherwise */
  detect: () => Promise<string | null>
  format: 'jsonc' | 'toml'
}

const defaultHttpConfig = (token: string) => ({
  type: 'http',
  url: MCP_SERVER_URL,
  headers: {Authorization: `Bearer ${token}`},
})

const homeDir = os.homedir()

/**
 * Centralized editor configuration including detection logic.
 * To add a new editor: add an entry here - EditorName type is derived automatically.
 */
export const EDITOR_CONFIGS = {
  'Cursor': {
    buildServerConfig: defaultHttpConfig,
    configKey: 'mcpServers',
    detect: async () => {
      const cursorDir = path.join(homeDir, '.cursor')
      return existsSync(cursorDir) ? path.join(cursorDir, 'mcp.json') : null
    },
    format: 'jsonc',
  },
  'VS Code': {
    buildServerConfig: defaultHttpConfig,
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
    format: 'jsonc',
  },
  'VS Code Insiders': {
    buildServerConfig: defaultHttpConfig,
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
    format: 'jsonc',
  },
  'Claude Code': {
    buildServerConfig: defaultHttpConfig,
    configKey: 'mcpServers',
    detect: async () => {
      try {
        await execa('claude', ['--version'], {stdio: 'pipe', timeout: 5000})
        return path.join(homeDir, '.claude.json')
      } catch {
        return null
      }
    },
    format: 'jsonc',
  },
  'Codex CLI': {
    buildServerConfig: (token) => ({
      type: 'http',
      url: MCP_SERVER_URL,
      // eslint-disable-next-line camelcase
      http_headers: {Authorization: `Bearer ${token}`},
    }),
    configKey: 'mcp_servers',
    detect: async () => {
      try {
        await execa('codex', ['--version'], {stdio: 'pipe', timeout: 5000})
        const codexHome = process.env.CODEX_HOME || path.join(homeDir, '.codex')
        return path.join(codexHome, 'config.toml')
      } catch {
        return null
      }
    },
    format: 'toml',
  },
  'Gemini CLI': {
    buildServerConfig: defaultHttpConfig,
    configKey: 'mcpServers',
    detect: async () => {
      const geminiDir = path.join(homeDir, '.gemini')
      return existsSync(geminiDir) ? path.join(geminiDir, 'settings.json') : null
    },
    format: 'jsonc',
  },
  'GitHub Copilot CLI': {
    buildServerConfig: (token) => ({
      type: 'http',
      url: MCP_SERVER_URL,
      headers: {Authorization: `Bearer ${token}`},
      tools: ['*'],
    }),
    configKey: 'mcpServers',
    detect: async () => {
      const copilotDir =
        process.platform === 'linux' && process.env.XDG_CONFIG_HOME
          ? path.join(process.env.XDG_CONFIG_HOME, 'copilot')
          : path.join(homeDir, '.copilot')
      return existsSync(copilotDir) ? path.join(copilotDir, 'mcp-config.json') : null
    },
    format: 'jsonc',
  },
  'Zed': {
    buildServerConfig: (token) => ({
      url: MCP_SERVER_URL,
      headers: {Authorization: `Bearer ${token}`},
      settings: {},
    }),
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
    format: 'jsonc',
  },
  'OpenCode': {
    buildServerConfig: (token) => ({
      type: 'remote',
      url: MCP_SERVER_URL,
      headers: {Authorization: `Bearer ${token}`},
    }),
    configKey: 'mcp',
    detect: async () => {
      try {
        await execa('opencode', ['--version'], {stdio: 'pipe', timeout: 5000})
        return path.join(homeDir, '.config/opencode/opencode.json')
      } catch {
        return null
      }
    },
    format: 'jsonc',
  },
} satisfies Record<string, EditorConfig>

/** Derived from EDITOR_CONFIGS keys - add a new editor there and this updates automatically */
export type EditorName = keyof typeof EDITOR_CONFIGS
