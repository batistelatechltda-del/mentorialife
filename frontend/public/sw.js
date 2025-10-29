self.addEventListener('push', (event) => {

  const data = event.data?.json() || {};

  const title = data.title || "Default Title";
  const options = {
    body: data.body || "No body",

  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
