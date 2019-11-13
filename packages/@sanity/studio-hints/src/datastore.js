const key = 'studioHints'

const defaultSettings = {
  isTrayOpen: true, // tray state
  selectedHint: null // set if the user has "drilled down" to a specific hint
}

function loadSettings() {
  const settings = localStorage.getItem(key)
  if (settings) {
    return JSON.parse(settings)
  }
  storeSettings(defaultSettings)
  return defaultSettings
}

function storeSettings(settingsObject) {
  localStorage.setItem(key, JSON.stringify(settingsObject))
}

export function isTrayOpen() {
  const settings = loadSettings()
  return settings.isTrayOpen !== false // true or unset means the tray is open
}

export function toggleTrayOpenState() {
  const settings = loadSettings()
  const updatedSettings = {...settings, isTrayOpen: !isTrayOpen()}
  console.log('toggleTrayOpenState.updatedSettings', updatedSettings)
  storeSettings(updatedSettings)
}

export function getSelectedHint() {
  const settings = loadSettings()
  return settings.selectedHint
}

export function setSelectedHint(hintId) {
  const settings = loadSettings()
  const updatedSettings = {...settings, selectedHint: hintId}
  console.log('setSelectedHint.updatedSettings', updatedSettings)
  storeSettings(updatedSettings)
}
