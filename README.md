# Foxhole Artillery

Foxhole Artillery is a browser-based fire-control and coordination tool for the game Foxhole. It combines an interactive world map with artillery calculations so a group can manage guns, spotters, targets, range limits, dispersion, and wind compensation from one interface.

This is a personal project and is not affiliated with or endorsed by Siege Camp.

## What it does

- Displays the Foxhole world map and current public map data from the official War API.
- Supports multiple fire groups, guns, targets, and chained spotter positions.
- Binds base and spotter positions to live map locations.
- Calculates range and azimuth for each gun against the selected target.
- Applies weapon-specific range, inaccuracy, and wind effects to the firing solution.
- Visualizes firing geometry, range limits, aim points, and dispersion on the map.
- Persists the current setup in browser local storage.
- Provides optional Discord OAuth and role-based access control for hosted deployments.
- Caches upstream War API responses on the server to avoid unnecessary requests.
- Includes Docker configurations for development and production deployment.

## Stack

Client:

- React 19
- TypeScript
- MobX
- Vite
- Tailwind CSS

Server:

- Node.js
- Express
- Express Session
- Foxhole War API integration
- Discord OAuth / guild role validation

Deployment:

- Docker
- Docker Compose

## Running locally

The simplest development setup is Docker Compose:

```bash
docker compose up --build
```

The client is then available at:

```text
http://localhost:3000
```

The development compose configuration disables Discord authentication. The API server runs on port 8080.

For a hosted deployment, copy `.env.example` to your deployment environment and provide the required values. Do not commit the populated environment file.

## Discord access control

Discord authentication is optional. When enabled, the server uses Discord OAuth to identify the user and verifies membership in a configured guild role before allowing access to the application.

The following environment variables are used:

```text
SESSION_SECRET
COOKIE_SECURE
DISCORD_AUTH_DISABLED
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
DISCORD_REDIRECT_URI
DISCORD_GUILD_ID
DISCORD_REQUIRED_ROLE_ID
DISCORD_BOT_TOKEN
```

## Foxhole data and assets

The application uses the public Foxhole War API for live map data.

Foxhole, its map artwork, icons, names, and other game assets are property of Siege Camp / Clapfoot Inc. The game assets under `client/public/tiles` and `client/public/icons` are not covered by this repository's MIT license. See `THIRD_PARTY_ASSETS.md` for details.

## License

The original source code in this repository is available under the MIT License. Third-party game assets are excluded from that license.
