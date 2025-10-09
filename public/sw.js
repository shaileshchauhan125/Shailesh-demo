const CACHE_NAME = 'ludo-game-v1.0.0';
const STATIC_CACHE_NAME = 'ludo-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'ludo-dynamic-v1.0.0';

// List of files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/style.css',
  '/lobby.css',
  '/script.js',
  '/local-game.js',
  '/ai-player.js',
  '/sound-manager.js',
  '/pwa.js',
  '/favicon.svg',
  '/manifest.json',
  
  // Audio assets
  '/assets/audio/blockade.mp3',
  '/assets/audio/boop.mp3',
  '/assets/audio/button_click.mp3',
  '/assets/audio/capture.mp3',
  '/assets/audio/chat_pop.mp3',
  '/assets/audio/cyberpunk.mp3',
  '/assets/audio/dice_roll_end.mp3',
  '/assets/audio/dice_roll_start.mp3',
  '/assets/audio/egypt.mp3',
  '/assets/audio/game_start.mp3',
  '/assets/audio/invalid_move.mp3',
  '/assets/audio/jurassic.mp3',
  '/assets/audio/opponent_joins.mp3',
  '/assets/audio/roll_six.mp3',
  '/assets/audio/safe_home.mp3',
  '/assets/audio/space.mp3',
  '/assets/audio/token_move.mp3',
  '/assets/audio/token_select.mp3',
  '/assets/audio/victory.mp3',
  '/assets/audio/wah_wah.mp3',
  '/assets/audio/your_turn.mp3',
  
  // Theme images
  '/assets/images/cyberpunk.gif',
  '/assets/images/egypt.gif',
  '/assets/images/jurassic.gif',
  '/assets/images/space.gif',
  
  // Icons
  '/assets/icons/settings.svg',
  '/assets/icons/volume-mute.svg',
  '/assets/icons/volume-up.svg',
  
  // External resources
  'https://fonts.googleapis.com/css2?family=Oxanium:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js'
];

// Network-first resources (for real-time features)
const NETWORK_FIRST = [
  '/socket.io/',
  '/api/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install Event');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate Event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests that aren't in our cache list
  if (url.origin !== location.origin && !STATIC_ASSETS.some(asset => asset.includes(url.href))) {
    return;
  }
  
  // Network-first strategy for real-time features
  if (NETWORK_FIRST.some(path => url.pathname.startsWith(path))) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Cache-first strategy for static assets
  event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache-first strategy failed', error);
    
    // Return offline page for navigation requests only if we're actually offline
    if (request.destination === 'document') {
      // Try to return the main page from cache first
      const cachedMain = await caches.match('/');
      if (cachedMain) {
        return cachedMain;
      }
      // If main page not cached, return offline page
      return caches.match('/offline.html');
    }
    
    // Return a generic offline response
    return new Response('Offline content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Network-first strategy failed, falling back to cache', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a generic offline response
    return new Response('Content not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // For example, sync game state, send pending messages, etc.
  console.log('Service Worker: Performing background sync');
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  const options = {
    body: event.data ? event.data.text() : 'New game invitation!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open Game',
        icon: '/icons/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Ludo Game', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click event');
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.ports[0].postMessage({
      type: 'CACHE_STATUS',
      isOfflineReady: true
    });
  }
});
