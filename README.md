## Prerequisite
1. Access to Enthusiast instance
2. Enthusiast with configured Medusa source [Docs](https://upsidelab.io/tools/enthusiast/integrations/medusa)

## Installation
Install the plugin in your Medusa project:
```bash
npm install @uspidelab/medusa-enthusiast
```
## Configuration
### Environment Variables
Set you .env file in project root directory:
```dotenv
ENTHUSIAST_API_URL=http://localhost:10000
ENTHUSIAST_WS_URL=ws://localhost:10000
ENTHUSIAST_SERVICE_ACCOUNT_TOKEN=<generated-service-account-token>
ENTHUSIAST_MEDUSA_PRODUCT_SOURCE_NAME=MedusaSource
```
- `ENTHUSIAST_API_URL`: Your Enthusiast instance base API url.
- `ENTHUSIAST_WS_URL`: Your Enthusiast instance base WS url.
- `ENTHUSIAST_SERVICE_ACCOUNT_TOKEN`: Your Enthusiast admin service account's token.
- `ENTHUSIAST_MEDUSA_PRODUCT_SOURCE_NAME`: Your Enthusiast instance Medusa plugin name.
### Enable plugin in Medusa
Add below entry to your plugins array:
#### medusa-config.ts
```typescript
{
  resolve: "@upsideuspidelab/medusa-enthusiast",
  options: {
    enthusiastApiUrl: process.env.ENTHUSIAST_API_URL,
    enthusiastWSUrl: process.env.ENTHUSIAST_WS_URL,
    enthusiastServiceAccountToken: process.env.ENTHUSIAST_SERVICE_ACCOUNT_TOKEN,
    enthusiastMedusaSourcePluginName: process.env.ENTHUSIAST_MEDUSA_PRODUCT_SOURCE_NAME,
  }
}
```
## Generating service account key
Run command on your Enthusiast instance or go to `Manage -> Service accounts` in Enthusiast to generate Admin permission service account token.
Command:
```bash
python manage.py createserviceaccount -n <name of your integration> --admin
```