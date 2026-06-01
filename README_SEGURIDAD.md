# TTC Fichas - version segura para Vercel

Esta version evita que el navegador descargue el Google Sheet directamente.
El frontend llama a `/api/catalogos`, y esa API:

1. Verifica el token de Firebase Auth.
2. Rechaza correos que no sean `@transportesttc.com.mx`.
3. Lee el Google Sheet privado con una cuenta de servicio.
4. Regresa solo los catalogos necesarios a la app.

## Variables de entorno en Vercel

En Vercel > Project > Settings > Environment Variables agrega:

```txt
FIREBASE_PROJECT_ID=ttc-fichas-app
FIREBASE_CLIENT_EMAIL=correo-de-la-cuenta-de-servicio
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GOOGLE_SHEET_ID=1ShvndImW2blM-0wBnP7mJ5Riz8zzpvUFAoxlZzEhmNg
ALLOWED_EMAIL_DOMAIN=transportesttc.com.mx
```

Si quieres usar credenciales separadas para Google Sheets:

```txt
GOOGLE_CLIENT_EMAIL=correo-de-la-cuenta-de-servicio
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

Si no las defines, la API usa `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`
tambien para Google Sheets.

## Pasos en Google Cloud / Firebase

1. En Firebase Console, abre Project Settings > Service accounts.
2. Genera una nueva private key para Node.js Admin SDK.
3. Copia `project_id`, `client_email` y `private_key` a Vercel.
4. En Google Cloud, confirma que Google Sheets API este habilitada.
5. Abre tu Google Sheet y compartelo con el `client_email` de la cuenta de servicio.
6. Pon el Google Sheet como Restringido, no publico.

## Deploy

Sube esta carpeta como el proyecto de Vercel:

```powershell
npm install
vercel deploy --prod
```

O conectala a GitHub y deja que Vercel haga el deploy.

## Nota

Mantener el Sheet publico no se puede ocultar de verdad. Si el navegador puede
descargarlo, cualquier persona puede encontrar la URL en el JavaScript publico.
La solucion segura es que solo el servidor de Vercel tenga acceso al Sheet.
