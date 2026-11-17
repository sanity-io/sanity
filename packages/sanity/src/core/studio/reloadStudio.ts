import {getMessageBusConnection} from '../store/messageBus/getMessageBusConnection'

function reloadPage() {
  window.location.reload()
}

/**
 * Reloads Studio. A message bus host shares its page with Studio, so it is asked to reload Studio
 * instead, and the page reloads when there is no host or it can't.
 *
 * @internal
 */
export function reloadStudio(): void {
  const connection = getMessageBusConnection()

  if (!connection) {
    reloadPage()

    return
  }

  connection.emit('applications.reload').then((reply) => {
    if (!reply.ok) reloadPage()
  }, reloadPage)
}
