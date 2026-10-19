(() => {
  const installButton = document.createElement("button");
  installButton.className = "pwa-install";
  installButton.type = "button";
  installButton.hidden = true;
  installButton.textContent = "Install app";
  installButton.setAttribute("aria-label", "Install WearShare");
  document.querySelector("#devbar").append(installButton);

  let installPrompt;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(error => {
      console.error("WearShare service worker registration failed.", error);
    });
  }

  if (isAppleMobile && !isStandalone) {
    installButton.hidden = false;
    installButton.textContent = "Add to Home Screen";
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.hidden = true;
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      window.alert("In Safari, tap Share, then Add to Home Screen to install WearShare.");
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
})();
