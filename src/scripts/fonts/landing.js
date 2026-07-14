(() => {
  const documentElement = document.documentElement;
  const languages =
    Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language || documentElement.lang || "en-US"];
  const normalizedLanguages = languages.map((language) => language.toLowerCase());
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const mainlandChinaTimeZones = new Set([
    "Asia/Shanghai",
    "Asia/Urumqi",
    "Asia/Chongqing",
    "Asia/Chungking",
    "Asia/Harbin",
    "Asia/Kashgar",
    "PRC",
  ]);
  const shouldAvoidGoogleFonts =
    mainlandChinaTimeZones.has(timeZone) ||
    normalizedLanguages.some((language) => /^zh(?:$|-hans\b|-cn\b)/.test(language));

  const fontFaces = {
    google: {
      body: {
        default: "Noto+Sans",
        "zh-Hans": "Noto+Sans+SC",
        "zh-Hant": "Noto+Sans+TC",
        ja: "Noto+Sans+JP",
        ko: "Noto+Sans+KR",
      },
      heading: "Cinzel",
      introBody: "IM+Fell+English",
      serif: "Noto+Serif",
    },
    jsdelivr: {
      body: {
        default: "https://cdn.jsdelivr.net/npm/@fontsource-variable/noto-sans@latest/wght.css",
        "zh-Hans": "https://cdn.jsdelivr.net/npm/@fontsource-variable/noto-sans-sc@latest/wght.css",
        "zh-Hant": "https://cdn.jsdelivr.net/npm/@fontsource-variable/noto-sans-tc@latest/wght.css",
        ja: "https://cdn.jsdelivr.net/npm/@fontsource-variable/noto-sans-jp@latest/wght.css",
        ko: "https://cdn.jsdelivr.net/npm/@fontsource-variable/noto-sans-kr@latest/wght.css",
      },
      heading: "https://cdn.jsdelivr.net/npm/@fontsource-variable/cinzel@latest/wght.css",
      introBody: "https://cdn.jsdelivr.net/npm/@fontsource/im-fell-english@latest/400.css",
      serif: "https://cdn.jsdelivr.net/npm/@fontsource-variable/noto-serif@latest/wght.css",
    },
  };

  const addPreconnect = (href, crossOrigin = false) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    if (crossOrigin) {
      link.crossOrigin = "";
    }
    document.head.append(link);
  };

  const addStylesheet = (href, onError) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    if (onError) {
      link.addEventListener("error", onError, { once: true });
    }
    document.head.append(link);
  };

  const loadJsDelivrFonts = () => {
    documentElement.dataset.fontCdn = "jsdelivr";
    addPreconnect("https://cdn.jsdelivr.net");
    addStylesheet(fontFaces.jsdelivr.body.default);
    addStylesheet(fontFaces.jsdelivr.heading);
    addStylesheet(fontFaces.jsdelivr.introBody);
    addStylesheet(fontFaces.jsdelivr.serif);
  };

  if (shouldAvoidGoogleFonts) {
    loadJsDelivrFonts();
    return;
  }

  documentElement.dataset.fontCdn = "google";
  addPreconnect("https://fonts.googleapis.com");
  addPreconnect("https://fonts.gstatic.com", true);
  addStylesheet(
    `https://fonts.googleapis.com/css2?family=${fontFaces.google.heading}:wght@400;600;700&family=${fontFaces.google.introBody}&family=${fontFaces.google.serif}:wght@400;500;600;700&family=${fontFaces.google.body.default}:wght@400;500;600;700&display=swap`,
    loadJsDelivrFonts,
  );
})();
