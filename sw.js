// Chronéo – service worker : met l'application en cache pour qu'elle s'ouvre hors connexion.
// Changer VERSION à chaque mise à jour des fichiers pour forcer le rafraîchissement du cache.
const VERSION = "chroneo-web-2";
const FICHIERS = ["./", "./index.html", "./manifest.webmanifest", "./icone-192.png", "./icone-512.png", "./icone-180.png", "./icone-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(cles => Promise.all(cles.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Réseau d'abord pour la page (mises à jour), cache en secours ; cache d'abord pour le reste (icônes, polices, bibliothèques).
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(r => { const copie = r.clone(); caches.open(VERSION).then(c => c.put("./index.html", copie)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(rep => {
    const u = e.request.url;
    const aGarder = u.startsWith(self.location.origin) || u.includes("fonts.g") || u.includes("cdnjs.cloudflare.com") || u.includes("cdn.jsdelivr.net");
    if ((rep.ok || rep.type === "opaque") && aGarder) {   // bibliothèques (PDF, lecture des justificatifs) gardées pour le hors connexion
      const copie = rep.clone(); caches.open(VERSION).then(c => c.put(e.request, copie));
    }
    return rep;
  })));
});
