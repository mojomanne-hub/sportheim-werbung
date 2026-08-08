/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => {
    return [
      {
        source: '/widget/:id',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https:; script-src 'self' 'unsafe-inline' https://www.fussball.de; style-src 'self' 'unsafe-inline'",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
