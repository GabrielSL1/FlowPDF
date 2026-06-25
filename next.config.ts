import type {NextConfig} from 'next';

// CSP calibrada para os domínios que o app de fato usa: Firebase Auth/Firestore
// (*.googleapis.com, accounts.google.com para o popup de login Google),
// Supabase Storage (nosso bucket), e unpkg.com (worker do pdf.js). 'unsafe-inline'
// e 'unsafe-eval' em script-src são necessários para a hidratação do Next.js
// sem usar nonces (que exigiriam middleware); isso reduz a proteção contra XSS
// via injeção de <script> inline, mas frame-src/connect-src/object-src ainda
// bloqueiam exfiltração de dados e embeds para domínios não autorizados.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://hvbzkzzcrtopnclbkkbl.supabase.co https://*.googleusercontent.com https://firebasestorage.googleapis.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.google.com https://hvbzkzzcrtopnclbkkbl.supabase.co wss://*.firebaseio.com",
  "frame-src 'self' https://hvbzkzzcrtopnclbkkbl.supabase.co https://*.firebaseapp.com https://accounts.google.com",
  "worker-src 'self' blob: https://unpkg.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hvbzkzzcrtopnclbkkbl.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
