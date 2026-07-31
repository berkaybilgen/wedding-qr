// api/upload.js
// Büyük dosyalar (video) Vercel'in 4.5 MB istek limitine takılmasın diye
// dosya baytları buradan GEÇMEZ. Bu fonksiyon sadece Google Drive'da bir
// "resumable upload" oturumu açar ve tarayıcının doğrudan yükleyebileceği
// geçici bir yükleme linki (uploadUrl) döner. Büyük dosya o linke gider.
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
  }

  try {
    // Vercel JSON gövdesini otomatik ayrıştırır; string gelirse yine de çöz.
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { name, mimeType } = body;

    if (!name) {
      return res.status(400).json({ error: 'Dosya adı gerekli.' });
    }

    // OAuth2 ile kendi Google hesabın adına yetkilen
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const { token } = await oauth2Client.getAccessToken();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Tarayıcının Origin'i: oturumu bununla açmazsak Google, tarayıcının
    // doğrudan yaptığı PUT yanıtına CORS başlığı koymaz ve yükleme %100
    // olsa bile tarayıcı yanıtı okuyamayıp hata verir.
    const origin = req.headers.origin;

    // Drive'da resumable oturumu başlat; dönen "Location" başlığı yükleme linkidir
    const initRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimeType || 'application/octet-stream',
          // Google'ın CORS başlığını yükleme yanıtına da koyması için şart
          ...(origin ? { Origin: origin } : {}),
        },
        body: JSON.stringify({
          name,
          parents: folderId ? [folderId] : undefined,
        }),
      }
    );

    if (!initRes.ok) {
      const text = await initRes.text();
      console.error('Resumable oturum hatası:', text);
      return res.status(500).json({ error: 'Yükleme oturumu oluşturulamadı.' });
    }

    const uploadUrl = initRes.headers.get('location');
    return res.status(200).json({ uploadUrl });
  } catch (error) {
    console.error('Oturum hatası:', error);
    return res.status(500).json({ error: error.message || 'Bir hata oluştu.' });
  }
}
