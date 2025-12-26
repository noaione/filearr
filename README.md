# filearr

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
1. install [Bun](https://bun.sh/)
2. clone this repo
3. copy `.env.example` to `.env` and adjust settings
4. generate secret with `openssl rand -base64 32` and set `SESSION_SECRET` in `.env`
5. run `bun install`
6. migrate database with `bunx prisma migrate dev`
7. run `bunx prisma generate` to generate prisma client
8. run `bun run scripts/setup.ts` to create admin user
9. run `bun run dev` to start development server
    - or: `bun run build` then `bun .output/server/index.mjs` for production
10. visit `http://localhost:4896` (or your set `PORT`)

## license
0BSD. See LICENSE file.

## disclaimer
this project is vibe coded then manually cleaned up and checked for any security issues. use at your own risk. no warranties given.

i mainly built this for personal use case since i'm too lazy to design something myself from scratch.
