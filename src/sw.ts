/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

// Reclama clientes inmediatamente
clientsClaim()

// Manejar actualización manual de versión
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Precachea assets inyectados por VitePWA
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST || [])

// Fallback SPA: intercepta las peticiones de navegación y devuelve el index.html
// Esto evita el error 404 al recargar desde rutas como /settings
try {
  registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))
} catch (error) {
  console.error('Error registrando ruta de navegación SPA:', error)
}

// ---------------------------------------------------------
// NOTIFICACIONES PUSH
// ---------------------------------------------------------

self.addEventListener('push', (event) => {
  if (!event) return

  let payload = {
    title: 'HourTrack',
    body: 'Tienes una nueva notificación.',
    icon: '/icon-192.png',
    url: '/'
  }

  if (event.data) {
    try {
      const data = event.data.json()
      payload = { ...payload, ...data }
    } catch (e) {
      payload.body = event.data.text()
    }
  }

  const notificationOptions: NotificationOptions = {
    body: payload.body,
    icon: payload.icon,
    data: { url: payload.url }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
