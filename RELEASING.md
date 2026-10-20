# Releasing

Releases are published to npm by [`.github/workflows/release.yml`](.github/workflows/release.yml) when a `v*` tag is pushed.

1. Update `data/devices.json` and set `updatedAt` to today's date.
2. Bump the version (see Versioning in the README) and push the tag:

   ```bash
   npm version patch
   git push --follow-tags
   ```

The workflow checks that the tag matches `package.json`, runs the tests and publishes with provenance.

## One-time setup

The workflow uses npm trusted publishing, which can only be configured for a package that already exists:

1. Create the `onesim` organization on npmjs.com (free for public packages) and log in: `npm login`.
2. Publish the first version by hand from a clean checkout of `main`: `npm ci && npm publish`.
3. On npmjs.com open the package → Settings → Trusted publishing, and add GitHub Actions with
   organization `Onesim-LLC`, repository `esim-compatible-devices`, workflow `release.yml`.
4. In the same settings, set "Publishing access" to require 2FA and disallow tokens.
