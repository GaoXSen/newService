const els = {
  appName: document.querySelector("#appName"),
  iosScheme: document.querySelector("#iosScheme"),
  androidScheme: document.querySelector("#androidScheme"),
  iosStoreUrl: document.querySelector("#iosStoreUrl"),
  androidStoreUrl: document.querySelector("#androidStoreUrl"),
  webUrl: document.querySelector("#webUrl"),
  helpUrl: document.querySelector("#helpUrl"),
  contactUrl: document.querySelector("#contactUrl"),
  privacyUrl: document.querySelector("#privacyUrl"),
  launchButton: document.querySelector("#launchButton"),
  copyButton: document.querySelector("#copyButton"),
  sceneLaunchButton: document.querySelector("#sceneLaunchButton"),
  deviceInfo: document.querySelector("#deviceInfo"),
  browserInfo: document.querySelector("#browserInfo"),
  statusBox: document.querySelector("#statusBox"),
};

function getEnvironment() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isWeChat = /MicroMessenger/i.test(ua);
  const isWeibo = /Weibo/i.test(ua);
  const isQQ = /QQ\//i.test(ua);

  return {
    ua,
    isIOS,
    isAndroid,
    isWeChat,
    isWeibo,
    isQQ,
    label: isIOS ? "iPhone / iPad" : isAndroid ? "Android" : "Desktop / Other",
  };
}

function setStatus(message, type = "default") {
  els.statusBox.textContent = message;
  els.statusBox.className = "status-box";
  if (type !== "default") {
    els.statusBox.classList.add(type);
  }
}

function updateEnvironmentView(env) {
  const browserLabel = env.isWeChat
    ? "微信内打开，深链常被限制"
    : env.isWeibo
      ? "微博内打开，深链可能受限"
      : env.isQQ
        ? "QQ 内打开，深链可能受限"
        : "系统浏览器或普通 WebView";

  els.deviceInfo.textContent = env.label;
  els.browserInfo.textContent = browserLabel;
}

function getConfig() {
  return {
    appName: els.appName.value.trim() || "Demo App",
    iosScheme: els.iosScheme.value.trim(),
    androidScheme: els.androidScheme.value.trim(),
    iosStoreUrl: els.iosStoreUrl.value.trim(),
    androidStoreUrl: els.androidStoreUrl.value.trim(),
    webUrl: els.webUrl.value.trim(),
    helpUrl: els.helpUrl.value.trim(),
    contactUrl: els.contactUrl.value.trim(),
    privacyUrl: els.privacyUrl.value.trim(),
  };
}

function getLaunchUrl(config, env) {
  if (env.isIOS) {
    return config.iosScheme;
  }
  if (env.isAndroid) {
    return config.androidScheme;
  }
  return "";
}

function getFallbackUrl(config, env) {
  if (env.isIOS) {
    return config.iosStoreUrl;
  }
  if (env.isAndroid) {
    return config.androidStoreUrl;
  }
  return config.iosStoreUrl || config.androidStoreUrl;
}

function openUrl(url) {
  if (!url) {
    return false;
  }

  window.location.href = url;
  return true;
}

function openNamedLink(key) {
  const config = getConfig();
  const url = config[key];
  if (!url) {
    setStatus("当前入口还没有配置地址，请先填写对应链接。", "error");
    return;
  }

  setStatus(`正在打开 ${url}`);
  openUrl(url);
}

function launchApp() {
  const env = getEnvironment();
  const config = getConfig();
  const launchUrl = getLaunchUrl(config, env);
  const fallbackUrl = getFallbackUrl(config, env);

  if (!env.isIOS && !env.isAndroid) {
    setStatus("当前不是手机环境。请用 iPhone 或 Android 浏览器打开这个页面。", "error");
    return;
  }

  if (env.isWeChat || env.isWeibo || env.isQQ) {
    setStatus("当前在内置浏览器中，深链通常会被拦截。建议点击右上角后，选择在系统浏览器打开。", "error");
    return;
  }

  if (!launchUrl) {
    setStatus("当前平台没有可用的拉起地址，请先填写对应平台的深链。", "error");
    return;
  }

  setStatus(`正在尝试打开 ${config.appName}... 如果没有成功，将自动跳转到下载页。`);

  const start = Date.now();
  const timer = window.setTimeout(() => {
    const elapsed = Date.now() - start;
    if (document.hidden || document.visibilityState === "hidden") {
      setStatus(`${config.appName} 已被系统接管，页面进入后台。`, "success");
      return;
    }

    if (fallbackUrl) {
      setStatus(`未检测到 ${config.appName} 成功拉起，${elapsed}ms 后跳转到下载页。`, "error");
      window.location.href = fallbackUrl;
      return;
    }

    setStatus(`未检测到 ${config.appName} 成功拉起，也没有配置回退地址。`, "error");
  }, 1600);

  const clearTimer = () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", clearTimer);
  };

  const handleVisibilityChange = () => {
    if (document.hidden || document.visibilityState === "hidden") {
      clearTimer();
      setStatus(`${config.appName} 已被系统接管，页面进入后台。`, "success");
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", clearTimer, { once: true });

  openUrl(launchUrl);
}

async function copyConfig() {
  const config = getConfig();
  const content = JSON.stringify(config, null, 2);

  try {
    await navigator.clipboard.writeText(content);
    setStatus("当前配置已复制，可以直接发给前端接入真实深链。", "success");
  } catch (error) {
    setStatus("复制失败。当前浏览器可能不支持剪贴板接口。", "error");
  }
}

updateEnvironmentView(getEnvironment());
els.launchButton.addEventListener("click", launchApp);
els.sceneLaunchButton.addEventListener("click", launchApp);
els.copyButton.addEventListener("click", copyConfig);

document.querySelectorAll("[data-link-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.getAttribute("data-link-target");
    openNamedLink(target);
  });
});
