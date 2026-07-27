// api/upload.js
import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
  }

  try {
    const form = formidable({ multiples: true });

    // Formidable ile dosyaları ayrıştırıyoruz
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Dosya(lar)ı güvenli bir şekilde diziye dönüştürüyoruz
    const rawFiles = files.file;
    if (!rawFiles) {
      return res.status(400).json({ error: 'Yüklenecek dosya bulunamadı.' });
    }

    const fileList = Array.isArray(rawFiles) ? rawFiles : [rawFiles];

    // Google OAuth2 Yapılandırması (kişisel Gmail hesabı adına yükleme)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Drive'a yükleme işlemleri
    const uploadPromises = fileList.map(async (file) => {
      const fileMetadata = {
        name: file.originalFilename || file.newFilename || `foto_${Date.now()}.jpg`,
        parents: [folderId],
      };

      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.filepath),
      };

      return drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });
    });

    await Promise.all(uploadPromises);

    return res.status(200).json({ success: true, message: 'Yükleme başarılı!' });
  } catch (error) {
    console.error('Drive Yükleme Hatası:', error);
    return res.status(500).json({ error: error.message || 'Yükleme sırasında bir hata oluştu.' });
  }
}