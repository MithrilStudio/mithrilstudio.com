(() => {
  const hostname = (window.location.hostname || "").toLowerCase();
  const isLocalhost = hostname === "localhost";
  const isMyrionDomain = hostname === "myrionstudio.com" || hostname.endsWith(".myrionstudio.com");
  if (!isLocalhost && !isMyrionDomain) {
    return;
  }

  const languages =
    Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  const normalizedLanguages = languages.map((language) => (language || "").toLowerCase());
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
  const isSimplifiedChinese = normalizedLanguages.some((language) => /^zh(?:$|-hans\b|-cn\b)/.test(language));
  const isChinaTimezone = mainlandChinaTimeZones.has(timeZone);

  if (!isSimplifiedChinese && !isChinaTimezone) {
    return;
  }

  const filing = document.getElementById("icpFiling");
  if (filing) {
    filing.classList.add("is-visible");
  }
})();
