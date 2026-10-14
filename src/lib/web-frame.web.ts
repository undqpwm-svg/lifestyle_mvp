// Демо в браузере на компьютере: приложение показывается «телефоном» по центру экрана,
// а не растягивается на весь монитор. На узких экранах (телефон) — как обычно, во весь экран.
const CSS = `
@media (min-width: 700px) {
  html, body { background: #111111; }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  #root {
    width: 420px; max-width: 420px; height: min(900px, calc(100vh - 48px)); flex: none;
    border-radius: 36px; overflow: hidden; position: relative;
    box-shadow: 0 0 0 10px #2a2a2a, 0 30px 80px rgba(0,0,0,0.6);
    transform: translateZ(0); /* position: fixed внутри приложения — относительно «телефона» */
  }
  /* Modal в react-native-web рендерится порталом в body, мимо #root — вписываем его в ту же рамку */
  [aria-modal="true"] {
    left: calc(50vw - 210px) !important; right: auto !important; width: 420px;
    top: calc((100vh - min(900px, calc(100vh - 48px))) / 2) !important; bottom: auto !important;
    height: min(900px, calc(100vh - 48px));
    border-radius: 36px; overflow: hidden;
  }
}`;

let installed = false;
export function installWebFrame() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  const style = document.createElement('style');
  style.setAttribute('data-lifestyle-frame', '');
  style.textContent = CSS;
  document.head.appendChild(style);
}
