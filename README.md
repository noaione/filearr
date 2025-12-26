# filearr

stupidly simple file sharing server

## features
- single admin user (with setup script)
- password protected shares
- bulk file downloads as zip
- download statistics
- fully local, no 3rd party services

## running
1. install [Bun](https://bun.sh/)
2. clone this repo
3. run `bun install`
4. run `bun run scripts/setup.ts` to create admin user
5. copy `.env.example` to `.env` and adjust settings
6. generate secret with `openssl rand -base64 32` and set `SESSION_SECRET` in `.env`
7. migrate database with `bunx prisma migrate dev`
8. run `bun run dev` to start development server
    - or: `bun run build` then `bun .output/server/index.mjs` for production
9. visit `http://localhost:4896` (or your set `PORT`)

## license
0BSD. See LICENSE file.

## disclaimer
this project is vibe coded then manually cleaned up and checked for any security issues. use at your own risk. no warranties given.

i mainly built this for personal use case since i'm too lazy to design something myself from scratch.
