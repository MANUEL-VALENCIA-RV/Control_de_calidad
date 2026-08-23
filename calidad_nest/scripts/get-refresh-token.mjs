import { createServer } from 'node:http';
import 'dotenv/config';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI?.trim() || 'http://localhost:8080';
const redirectUrl = new URL(REDIRECT_URI);
const REDIRECT_PORT = Number(redirectUrl.port || 8080);
const SCOPES = 'https://www.googleapis.com/auth/drive';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en el .env');
  process.exit(1);
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth' +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  '&response_type=code' +
  `&scope=${encodeURIComponent(SCOPES)}` +
  '&access_type=offline' +
  '&prompt=consent';

console.log('\n1) Abre esta URL con la cuenta de Google dueña o autorizada para la carpeta:\n');
console.log(authUrl + '\n');

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', REDIRECT_URI);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Error de autorización: ${error}\n`);
    server.close();
    return;
  }

  if (!code) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h3>Esperando autorización de Google...</h3>');
    return;
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    res.writeHead(tokenRes.ok ? 200 : 400, {
      'Content-Type': 'text/plain; charset=utf-8',
    });

    if (!tokenRes.ok || !tokens.refresh_token) {
      res.end(
        'No se obtuvo refresh_token.\n\nRespuesta de Google:\n' +
          JSON.stringify(tokens, null, 2) +
          '\n\nSi ya habías autorizado la app, revoca el acceso y vuelve a ejecutar este script.',
      );
    } else {
      res.end(
        'Listo. Guarda este valor como GOOGLE_REFRESH_TOKEN en tu .env local y en Render:\n\n' +
          tokens.refresh_token +
          '\n',
      );
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Error obteniendo token: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    server.close();
  }
});

server.listen(REDIRECT_PORT, '127.0.0.1', () => {
  console.log(`2) Servidor OAuth escuchando en ${REDIRECT_URI}\n`);
  console.log('3) Después de autorizar, Google regresará a esta dirección.\n');
});
