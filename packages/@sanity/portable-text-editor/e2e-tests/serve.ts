// Start servers file for 'npm start'

import globalSetup from './setup/globalSetup'

globalSetup().then(() => {
  // eslint-disable-next-line no-console
  console.log(
    'Started web and websocket servers.\n\nhttp://localhost:3000 (web)\n\nhttp://localhost:3001 (ws)',
  )
})
