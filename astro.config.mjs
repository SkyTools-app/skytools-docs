import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    starlight({
      title: 'SkyTools API',
      description: 'Developer documentation for the SkyTools Hypixel SkyBlock API',
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.googleapis.com',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossorigin: '',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'color-scheme',
            content: 'dark light',
          },
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Authentication', link: '/authentication/' },
            { label: 'Rate Limits', link: '/rate-limits/' },
            { label: 'Errors', link: '/errors/' },
          ],
        },
        {
          label: 'Endpoints',
          autogenerate: { directory: 'endpoints' },
        },
        {
          label: 'Dashboard',
          items: [
            { label: 'API Key Management', link: '/dashboard' },
          ],
        },
      ],
    }),
    react(),
  ],
});
