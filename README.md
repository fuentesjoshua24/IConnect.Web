# IConnectWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Cloudflare deployment

This repository is configured for a Cloudflare Worker serving Angular static assets through `wrangler.jsonc`. Cloudflare Workers Builds should run `npm ci` and `npm run deploy:cloudflare` from the repository root. The configured asset directory is `dist/IConnect.Web/browser`; Angular routes are served through the configured SPA fallback. Wrangler deployment credentials must be provided to the build as a secret environment variable, never committed to the repository.

The production API URL in `src/environments/environment.production.ts` is `https://iconnect-api.runasp.net` (without an `/api` suffix). Update it if the API hostname changes. This URL is public client configuration, not a secret.

Allow the exact deployed web origin `https://iconnect-web.myproject24.workers.dev` in the API's `Cors:Origins` setting. Set `App:FrontendUrl` to the same origin for reset links. Do not put database connection strings, JWT signing secrets, SMTP credentials, or service-principal secrets in the web project or Cloudflare's frontend build variables: browser-delivered configuration is public. Those credentials belong in the API hosting platform's secret store and are documented in the API repository's `infra/README.md`.

Browser authentication uses an `HttpOnly; Secure; SameSite=None` API cookie in Production; the web app does not persist or read the JWT. Credentialed CORS must be enabled for the exact web origin on the API. Your current `workers.dev` and `runasp.net` hostnames are cross-site; although `SameSite=None` allows cross-origin HTTPS requests, browser third-party-cookie restrictions may still block the cookie. For reliable sessions, use custom web/API hostnames under the same registrable domain or a same-origin `/api` proxy.

The public `_headers` file adds baseline browser security headers. `Strict-Transport-Security` assumes the site is served only over HTTPS.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
