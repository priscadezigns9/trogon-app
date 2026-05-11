// service-worker.js
self.addEventListener('fetch', function(event) {
  var url = event.request.url;
  if (url.includes('/app.html')) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        return response.text().then(function(html) {
          var patched = html.replace(
            '<head>',
            '<head><script src="/sb-fix.js"><\/script>'
          );
          return new Response(patched, {
            status: response.status,
            statusText: response.statusText,
            headers: {'Content-Type': 'text/html'}
          });
        });
      })
    );
  }
});
