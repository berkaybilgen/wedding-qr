// scripts/get-refresh-token.js
// Bu scripti SADECE BİR KEZ, kendi bilgisayarında çalıştır.
// Amacı: Kendi Google hesabın adına Drive'a yükleme yapabilmek için
// bir "refresh token" almak. Aldığın token'ı Vercel'de (veya .env'de)
// GOOGLE_REFRESH_TOKEN olarak saklayacaksın.
//
// Çalıştırmadan önce ortam değişkenlerini ver:
//   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/get-refresh-token.js
//
// (İstersen bu iki değeri aşağıda tırnak içine de yazabilirsin.)

import http from 'http';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'BURAYA_CLIENT_ID';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'BURAYA_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:5555/oauth2callback';
const PORT = 5555;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // refresh_token almak için şart
  prompt: 'consent', // her seferinde refresh_token dönmesini garanti eder
  scope: ['https://www.googleapis.com/auth/drive.file'],
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400);
    res.end('Kod bulunamadı.');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2>Başarılı! Terminale dönebilirsin, refresh token orada.</h2>');

    console.log('\n============================================================');
    if (tokens.refresh_token) {
      console.log('✅ REFRESH TOKEN (bunu GOOGLE_REFRESH_TOKEN olarak sakla):\n');
      console.log(tokens.refresh_token);
    } else {
      console.log('⚠️  refresh_token gelmedi. Google hesabındaki bu uygulamanın');
      console.log('   erişimini iptal edip tekrar dene (prompt=consent zaten ekli).');
    }
    console.log('============================================================\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Token alınırken hata:', err.message);
    res.writeHead(500);
    res.end('Hata: ' + err.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log('\n1) Aşağıdaki bağlantıyı tarayıcıda aç ve kendi Gmail hesabınla giriş yap:\n');
  console.log(authUrl);
  console.log('\n2) İzin verdikten sonra token terminalde görünecek.\n');
});
