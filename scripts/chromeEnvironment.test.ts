import {describe, expect, test} from 'vitest'

import {chromeEnvironment} from './chromeEnvironment'

const SECRETS = {
  STUDIO_AUTH_TOKEN: 'sk...',
  SANITY_AUTH_TOKEN: 'sk...',
  GITHUB_TOKEN: 'ghp_...',
  AWS_SECRET_ACCESS_KEY: 'aws...',
  ENCRYPTION_KEY: 'enc...',
  SSH_KEY: 'ssh...',
  KEY: 'key',
  GOOGLE_API_KEY: 'AIza...',
  // Share a prefix with allowlisted names and must still be dropped
  CHROME_API_KEY: 'chrome...',
  CHROME_TOKEN: 'chrome...',
  SSL_CERT_PASSWORD: 'cert...',
  XDG_API_KEY: 'xdg...',
  LC_SECRET_KEY: 'lc...',
  DATABASE_URL: 'postgres://user:password@db/app',
  npm_config_registry: 'https://registry.npmjs.org/',
}

describe('chromeEnvironment', () => {
  test('keeps what Chrome needs on Unix and drops everything else', () => {
    const env = {
      HOME: '/home/dev',
      PATH: '/usr/bin:/bin',
      USER: 'dev',
      LOGNAME: 'dev',
      SHELL: '/bin/zsh',
      TMPDIR: '/tmp',
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      LC_TIME: 'nb_NO.UTF-8',
      TZ: 'Europe/Oslo',
      DISPLAY: ':1',
      WAYLAND_DISPLAY: 'wayland-0',
      XAUTHORITY: '/home/dev/.Xauthority',
      XDG_RUNTIME_DIR: '/run/user/1000',
      XDG_SESSION_TYPE: 'wayland',
      XDG_CURRENT_DESKTOP: 'GNOME',
      XDG_DATA_DIRS: '/usr/local/share:/usr/share',
      XDG_SESSION_ID: '2',
      DBUS_SESSION_BUS_ADDRESS: 'unix:path=/run/user/1000/bus',
      HTTPS_PROXY: 'http://proxy:3128',
      no_proxy: 'localhost,127.0.0.1',
      SSL_CERT_FILE: '/etc/ssl/certs/ca.pem',
      SSL_CERT_DIR: '/etc/ssl/certs',
      CHROME_DEVEL_SANDBOX: '/opt/chrome/chrome-sandbox',
      CHROME_PATH: '/opt/google/chrome/chrome',
      PWD: '/agent/repos/sanity',
      TERM: 'xterm-256color',
      ...SECRETS,
    }

    const result = chromeEnvironment(env)

    expect(result).toEqual({
      HOME: '/home/dev',
      PATH: '/usr/bin:/bin',
      USER: 'dev',
      LOGNAME: 'dev',
      SHELL: '/bin/zsh',
      TMPDIR: '/tmp',
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      LC_TIME: 'nb_NO.UTF-8',
      TZ: 'Europe/Oslo',
      DISPLAY: ':1',
      WAYLAND_DISPLAY: 'wayland-0',
      XAUTHORITY: '/home/dev/.Xauthority',
      XDG_RUNTIME_DIR: '/run/user/1000',
      XDG_SESSION_TYPE: 'wayland',
      XDG_CURRENT_DESKTOP: 'GNOME',
      XDG_DATA_DIRS: '/usr/local/share:/usr/share',
      DBUS_SESSION_BUS_ADDRESS: 'unix:path=/run/user/1000/bus',
      HTTPS_PROXY: 'http://proxy:3128',
      no_proxy: 'localhost,127.0.0.1',
      SSL_CERT_FILE: '/etc/ssl/certs/ca.pem',
      SSL_CERT_DIR: '/etc/ssl/certs',
      CHROME_DEVEL_SANDBOX: '/opt/chrome/chrome-sandbox',
      CHROME_PATH: '/opt/google/chrome/chrome',
    })
    for (const name of Object.keys(SECRETS)) {
      expect(result).not.toHaveProperty(name)
    }
  })

  test('matches Windows spellings case-insensitively and keeps their casing', () => {
    const env = {
      'Path': 'C:\\Windows\\system32;C:\\Windows',
      'SystemRoot': 'C:\\Windows',
      'SystemDrive': 'C:',
      'windir': 'C:\\Windows',
      'ComSpec': 'C:\\Windows\\system32\\cmd.exe',
      'PATHEXT': '.COM;.EXE;.BAT;.CMD',
      'USERPROFILE': 'C:\\Users\\dev',
      'HOMEDRIVE': 'C:',
      'HOMEPATH': '\\Users\\dev',
      'USERNAME': 'dev',
      'APPDATA': 'C:\\Users\\dev\\AppData\\Roaming',
      'LOCALAPPDATA': 'C:\\Users\\dev\\AppData\\Local',
      'ProgramData': 'C:\\ProgramData',
      'ProgramFiles': 'C:\\Program Files',
      'ProgramFiles(x86)': 'C:\\Program Files (x86)',
      'ProgramW6432': 'C:\\Program Files',
      'NUMBER_OF_PROCESSORS': '8',
      'PROCESSOR_ARCHITECTURE': 'AMD64',
      'TEMP': 'C:\\Users\\dev\\AppData\\Local\\Temp',
      'TMP': 'C:\\Users\\dev\\AppData\\Local\\Temp',
      'OS': 'Windows_NT',
      'PSModulePath': 'C:\\Program Files\\WindowsPowerShell\\Modules',
      ...SECRETS,
    }

    const result = chromeEnvironment(env)

    expect(Object.keys(result).sort()).toEqual(
      [
        'Path',
        'SystemRoot',
        'SystemDrive',
        'windir',
        'ComSpec',
        'PATHEXT',
        'USERPROFILE',
        'HOMEDRIVE',
        'HOMEPATH',
        'USERNAME',
        'APPDATA',
        'LOCALAPPDATA',
        'ProgramData',
        'ProgramFiles',
        'ProgramFiles(x86)',
        'ProgramW6432',
        'NUMBER_OF_PROCESSORS',
        'PROCESSOR_ARCHITECTURE',
        'TEMP',
        'TMP',
      ].sort(),
    )
    expect(result.Path).toBe('C:\\Windows\\system32;C:\\Windows')
    for (const name of Object.keys(SECRETS)) {
      expect(result).not.toHaveProperty(name)
    }
  })

  test('keeps macOS text encoding and matches exact names in any casing', () => {
    const result = chromeEnvironment({
      __CF_USER_TEXT_ENCODING: '0x1F5:0x0:0x0',
      lc_messages: 'C',
      xdg_config_home: '/home/dev/.config',
      Chrome_Log_File: '/tmp/chrome.log',
      GOOGLE_DEFAULT_CLIENT_SECRET: 'secret',
      SECRET_KEY_BASE: 'rails',
    })

    expect(result).toEqual({
      __CF_USER_TEXT_ENCODING: '0x1F5:0x0:0x0',
      lc_messages: 'C',
      xdg_config_home: '/home/dev/.config',
      Chrome_Log_File: '/tmp/chrome.log',
    })
  })

  test('only exact names pass, never a CHROME_, SSL_CERT_, XDG_ or LC_ prefix', () => {
    const result = chromeEnvironment({
      CHROME_DEVEL_SANDBOX: '/opt/chrome/chrome-sandbox',
      CHROME_HEADLESS: '1',
      SSL_CERT_DIR: '/etc/ssl/certs',
      XDG_CONFIG_HOME: '/home/dev/.config',
      LC_MESSAGES: 'C',
      CHROME_API_KEY: 'chrome...',
      CHROME_TOKEN: 'chrome...',
      CHROME_WRAPPER: '/usr/bin/google-chrome',
      SSL_CERT_PASSWORD: 'cert...',
      SSL_CERT_KEY: 'key...',
      XDG_API_KEY: 'xdg...',
      XDG_SESSION_ID: '2',
      LC_SECRET_KEY: 'lc...',
      LC_: 'empty-suffix',
    })

    expect(result).toEqual({
      CHROME_DEVEL_SANDBOX: '/opt/chrome/chrome-sandbox',
      CHROME_HEADLESS: '1',
      SSL_CERT_DIR: '/etc/ssl/certs',
      XDG_CONFIG_HOME: '/home/dev/.config',
      LC_MESSAGES: 'C',
    })
  })
})
