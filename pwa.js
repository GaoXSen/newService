let deferredInstallPrompt = null;

function updateInstallStatus(message) {
  const installStatus = document.querySelector("#installStatus");
  if (installStatus) {
    installStatus.textContent = message;
  }
}

function setInstallButtonVisible(visible) {
  const installButton = document.querySelector("#installButton");
  if (!installButton) {
    return;
  }

  installButton.hidden = !visible;
}

async function installApp() {
  if (!deferredInstallPrompt) {
    updateInstallStatus("当前浏览器没有直接安装按钮，可以用浏览器菜单里的“添加到主屏幕”或“安装应用”。");
    return;
  }

  deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;

  if (result.outcome === "accepted") {
    updateInstallStatus("安装请求已提交，浏览器会把这个网页加入主屏幕或桌面。");
  } else {
    updateInstallStatus("安装已取消，稍后仍然可以通过浏览器菜单继续安装。");
  }

  deferredInstallPrompt = null;
  setInstallButtonVisible(false);
}

function registerInstallPrompt() {
  const installButton = document.querySelector("#installButton");
  if (installButton) {
    installButton.addEventListener("click", installApp);
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallButtonVisible(true);
    updateInstallStatus("当前浏览器支持一键安装，点“安装到桌面”即可生成图标。");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    setInstallButtonVisible(false);
    updateInstallStatus("已经安装完成。以后可以像桌面应用一样直接打开。");
  });

  if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) {
    setInstallButtonVisible(false);
    updateInstallStatus("当前已经在独立应用窗口中运行。");
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    updateInstallStatus("当前浏览器不支持 Service Worker，页面仍然可以使用，但无法完整启用安装体验。");
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

registerInstallPrompt();
registerServiceWorker();
