const CACHE_NAME = 'uapp-cache-v303.1';
const urlsToCache = [
    '/uapp/index.html',
    '/uapp/css/onsen-css-components.css',
    '/uapp/css/onsenui.css',
    '/uapp/css/uapp_dark.css',
    '/uapp/css/uapp.css',
    '/uapp/js/uapp.js',
    '/uapp/js/onsenui.js',
    '/uapp/js/onsenui.min.js',
    '/uapp/js/angular-animate.min.js',
    '/uapp/js/jquery-1.9.1.min.js',
    '/uapp/js/mqttws31-min.js',
    '/uapp/js/ngStorage.min.js',
    '/uapp/js/xml2json.min.js',
    '/uapp/images/0.png',
    '/uapp/images/1.png',
    '/uapp/images/logo.png',
    
];
console.log('Service Worker starting...');
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                //console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Deleting all the caches not present in the whitelist
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
   // console.log('Handling fetch event for', event.request.url);

    // List of paths that should always fetch from the network and not be cached
    const bypassCachePaths = [
        '/chartdata',
        '/rauv',
        '/',
        '/login',
        '/emailalerts',
        '/deleteEvent',
        '/calendarEvents'
    ];

    // Function to determine if the request should bypass cache
    const shouldBypassCache = (request) => {
        return bypassCachePaths.some(path => request.url.includes(path));
    };

    // Check if the request should bypass cache
    if (shouldBypassCache(event.request)) {
       // console.log('Bypassing cache for', event.request.url);
        // Fetch from the network and do not cache these requests
        event.respondWith(fetch(event.request));
    } else {
        // Cache-first strategy for other requests (e.g., static assets)
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        //console.log('Found ', event.request.url, ' in cache');
                        return cachedResponse;
                    }
                  //  console.log('Network request for ', event.request.url);
                    return fetch(event.request)
                        .then(response => {
                            // Check if we received a valid response
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }


                            var responseToCache = response.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        });
                }).catch(error => {
                    console.error('Failed to fetch ', event.request.url, '; Error: ', error);
                    // Optionally, provide offline content if the cache match fails
                    
                })
        );
    }
});
// Adding push event listener
self.addEventListener('notificationclick', event => {
    //console.log('[Service Worker] Notification clicked.');

    event.notification.close();

    // Open the app or a specific URL when the notification is clicked
    event.waitUntil(
        clients.openWindow('https://forum.reefangel.com/uapp') 
        
    );
});

self.addEventListener('push', event => {
   // console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data ? event.data.text() : 'No data'}"`);
    const message = event.data ? event.data.text() : 'No specific message content available';
    const title = 'Reef Angel Alert';
    const options = {
        icon: 'AppImages/android/android-launchericon-192-192.png',
        body: message,
        badge: 'AppImages/android/badge.png',
    };

    event.waitUntil(self.registration.showNotification(title, options));
});
