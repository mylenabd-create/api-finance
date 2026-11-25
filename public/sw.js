// Service worker do Cerne.
// Regra: DADOS NUNCA VÊM DO CACHE. Só arquivos estáticos que não mudam
// (JS/CSS com hash, fontes, ícones) são guardados. Antes, qualquer GET era
// servido do cache primeiro — inclusive os dados das telas (RSC) — e o
// painel mostrava valores antigos depois de um lançamento.
const CACHE_VERSION = "cerne-v3";
const BASE_PATH = "/cerne-gestor";
const OFFLINE_URL = BASE_PATH + "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  BASE_PATH + "/manifest.json",
  BASE_PATH + "/icons/icon-192.png",
  BASE_PATH + "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

function ehEstatico(url) {
  return (
    url.pathname.startsWith(BASE_PATH + "/_next/static/") ||
    url.pathname.startsWith(BASE_PATH + "/icons/") ||
    /\.(?:woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação: sempre rede; sem internet, mostra a página offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res ?? Response.error()))
    );
    return;
  }

  // Dados (API, RSC/router.refresh e tudo que não é estático): rede direto.
  if (!ehEstatico(url)) return;

  // Estáticos: cache primeiro (os nomes têm hash, então não ficam velhos).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
