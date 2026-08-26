# Patch 33 — Promote Canvas token into Worker runtime

## Objective

Use the protected Cloudflare build environment as the source for `CANVAS_ACCESS_TOKEN` and upload it alongside the Worker code as an encrypted Worker secret.

## Required Cloudflare setting

Set the Workers Builds deploy command to:

`npm run deploy:cloudflare`

The previous command, `npx wrangler deploy`, bypasses the repository deployment wrapper and will continue to fail because `CANVAS_ACCESS_TOKEN` is only present in the build environment before deployment.

## Security boundary

The token is never committed, logged, or written into application assets. The temporary secrets file is created outside the repository with mode `0600` and removed after Wrangler exits.
