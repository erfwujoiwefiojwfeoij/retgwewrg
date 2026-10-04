export default function manifest() {
  return {
    name: 'LUNEA',
    short_name: 'LUNEA',
    description: 'Запись и рабочий кабинет',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#FFF9FA',
    theme_color: '#D9688A',
    lang: 'ru',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
