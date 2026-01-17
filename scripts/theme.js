async function loadTheme(themeName = "dark") {
  try {
    const res = await fetch("../colors.json");
    const allThemes = await res.json();

    const theme = allThemes[themeName];
    if (!theme) {
      console.error("Theme not found:", themeName);
      return;
    }

    for (const key in theme) {
      document.documentElement.style.setProperty(`--${key}`, theme[key]);
    }

    localStorage.setItem("ui-theme", themeName);

  } catch (err) {
    console.error("Error loading colors.json:", err);
  }
}

const savedTheme = localStorage.getItem("ui-theme") || "dark";
loadTheme(savedTheme);
