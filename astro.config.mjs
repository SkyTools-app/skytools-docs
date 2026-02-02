import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    starlight({
      title: 'SkyTools API',
      description: 'Developer documentation for the SkyTools Hypixel SkyBlock API',
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
