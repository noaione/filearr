<h1>
<img src="https://raw.githubusercontent.com/noaione/filearr/refs/heads/main/public/assets/favicons/android-chrome-96x96.png" alt="filearr Logo" width="32" height="32"> filearr
</h1>

stupidly simple file sharing server

## features
- single admin user (with setup script)
- file and folder sharing with unique tokens
- password protected shares
- bulk file downloads as zip
  - manual selection mode
  - all files download in folder
- download statistics
- fully local, no 3rd party services

## running
1. clone this repo
2. copy `.env.example` to `.env` and adjust settings
3. generate secret with `openssl rand -base64 32` and set `SESSION_SECRET` in `.env`
4. run `pnpm install --frozen-lockfile`
5. migrate database with `pnpx prisma migrate dev`
6. run `pnpx prisma generate` to generate prisma client
7. run `pnpm run scripts/setup.ts` to create admin user
8. run `pnpm run dev` to start development server
    - or: `pnpm run build` then `node .output/server/index.mjs` for production
9. visit `http://localhost:4896` (or your set `PORT`)

## license
0BSD. See LICENSE file.

Font in icon is [Monaspace Xenon](https://monaspace.githubnext.com/) by GitHub Next and Lettermatic.<br />
The icon itself is licensed under [CC0](https://creativecommons.org/public-domain/cc0/)

## disclaimer
this project is vibe coded then manually cleaned up and checked for any security issues. use at your own risk. no warranties given.

i mainly built this for personal use case since i'm too lazy to design something myself from scratch.
