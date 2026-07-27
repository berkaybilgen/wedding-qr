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

    // Google Auth Yapılandırması
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
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
        supportsAllDrives: true,
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