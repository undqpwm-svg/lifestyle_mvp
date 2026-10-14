// Динамическая часть конфига поверх app.json.
// Для публикации веб-демо на GitHub Pages: EXPO_BASE_URL=/lifestyle_mvp — сайт живёт в подпапке,
// и сборка делается одностраничной (SPA), чтобы прямые ссылки на экраны открывались через 404.html.
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  if (!baseUrl) return config;
  return {
    ...config,
    web: { ...config.web, output: 'single' },
    experiments: { ...config.experiments, baseUrl },
  };
};
