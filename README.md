# Medusa Enthusiast Plugin

A Medusa plugin that integrates with [Enthusiast](https://upsidelab.io/tools/enthusiast). See the [Enthusiast docs](https://upsidelab.io/tools/enthusiast/docs) to learn more about the platform.

## Prerequisites

1. Access to a [Suvereo](https://upsidelab.io/suvereo/docs) instance running the Enthusiast domain definition (Enthusiast 2.x)
2. The Medusa integration (`enthusiast-source-medusa`) registered in the instance's `CATALOG_INTEGRATION_PLUGINS`
3. Medusa v2.x
4. Node.js >= 20

## Installation

Install the plugin in your Medusa project:

```bash
npm install @upsidelab/medusa-plugin-enthusiast
```

## Configuration

### Environment Variables

Set you .env file in project root directory:

```dotenv
ENTHUSIAST_API_URL=http://localhost:10000
ENTHUSIAST_WS_URL=ws://localhost:10000
ENTHUSIAST_SERVICE_ACCOUNT_TOKEN=<generated-service-account-token>
ENTHUSIAST_MEDUSA_BACKEND_URL=http://host.docker.internal:9000
ENTHUSIAST_MEDUSA_ADMIN_URL=http://localhost:9000
```

- `ENTHUSIAST_API_URL`: Your Enthusiast instance base API url.
- `ENTHUSIAST_WS_URL`: Your Enthusiast instance base WS url. The plugin opens WebSocket connections with `ENTHUSIAST_MEDUSA_ADMIN_URL` as the `Origin`, so that URL must be listed in the instance's `ECL_DJANGO_CORS_ALLOWED_ORIGINS`.
- `ENTHUSIAST_SERVICE_ACCOUNT_TOKEN`: Your Enthusiast admin service account's token.
- `ENTHUSIAST_MEDUSA_BACKEND_URL(Optional)`: Your medusa backend url, where Enthusiast can send request to (default is set to `http://host.docker.internal:9000` for local docker development or admin.backendUrl is set)
- `ENTHUSIAST_MEDUSA_ADMIN_URL(Optional)`: Your medusa admin url (default is set to `http://localhost:9000`)
- `ENTHUSIAST_INTEGRATION_TYPE(Optional)`: The type of the integration registered in your Enthusiast instance (`CATALOG_INTEGRATION_PLUGINS`) that Medusa data is synchronized through (default is `medusa`). If you use the [enthusiast-source-medusa](https://pypi.org/project/enthusiast-source-medusa/) plugin, leave this unset. If you have your own implementation, set it to the type your integration is registered with (see `GET /api/integration-types/` on your instance).
- `ENTHUSIAST_OVERRIDE_EXISTING_INTEGRATION(Optional)`: The integration the plugin created itself is always reused. When `true`, and the dataset also has another integration of type `ENTHUSIAST_INTEGRATION_TYPE` that the plugin didn't create, that integration is adopted and its config overwritten. When `false` (default), a new integration is created instead and pre-existing ones are left untouched.

### Enable plugin in Medusa

Add below entry to your plugins array:

#### medusa-config.ts

```typescript
{
  resolve: "@upsidelab/medusa-plugin-enthusiast",
  options: {
        enthusiastApiUrl: process.env.ENTHUSIAST_API_URL,
        enthusiastWSUrl: process.env.ENTHUSIAST_WS_URL,
        enthusiastServiceAccountToken: process.env.ENTHUSIAST_SERVICE_ACCOUNT_TOKEN,
        enthusiastIntegrationType: process.env.ENTHUSIAST_INTEGRATION_TYPE,
        overrideExistingIntegration: process.env.ENTHUSIAST_OVERRIDE_EXISTING_INTEGRATION === "true",
        medusaBackendUrl: process.env.ENTHUSIAST_MEDUSA_BACKEND_URL,
        medusaAdminUrl: process.env.ENTHUSIAST_MEDUSA_ADMIN_URL,
      }
}
```

### Run Database Migrations

After installing and configuring the plugin, run database migrations to create the required tables:

```bash
npx medusa db:migrate
```

## Generating service account key

Run command on your Enthusiast instance or go to `Manage -> Service accounts` in Enthusiast to generate Admin permission service account token.
Command:

```bash
python manage.py createadminserviceaccount -n <name of your integration>
```

## Usage

Once installed and configured, you can access the Enthusiast plugin in your Medusa Admin:

- Main Enthusiast Page: Navigate to the "Enthusiast" section in the admin sidebar
- Settings: Go to Settings -> Enthusiast to manage datasets and configurations

## Version compatibility

| Enthusiast version | Plugin version |
| ------------------ | -------------- |
| 2.0 ([docs](https://upsidelab.io/tools/enthusiast/docs)) | `2.x` (`@upsidelab/medusa-plugin-enthusiast@^2.0.0`) |
| 1.7 ([legacy docs](https://upsidelab.io/tools/enthusiast/v1.7/docs)) | `1.0.0` (`@upsidelab/medusa-plugin-enthusiast@1.0.0`) |

The plugin versions are not interchangeable: 2.x talks to the Enthusiast 2.0 API, while 1.0.0 targets the Enthusiast 1.7 API.
