// api/upload.js
import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';

// Vercel'in varsayılan body parser'ını kapatıyoruz (Formidable kullanabilmek için)
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
    // Form verilerini ve dosyayı ayrıştırıyoruz
    const form = formidable({ multiples: true });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const fileList = Array.isArray(files.file) ? files.file : [files.file];

    // Google Auth Yapılandırması
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const uploadPromises = fileList.map(async (file) => {
      const fileMetadata = {
        name: file.originalFilename || `foto_${Date.now()}.jpg`,
        parents: [folderId],
      };

      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.filepath),
      };

      return drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
      });
    });

    await Promise.all(uploadPromises);

    return res.status(200).json({ success: true, message: 'Yükleme başarılı!' });
  } catch (error) {
    console.error('Drive Yükleme Hatası:', error);
    return res.status(500).json({ error: 'Yükleme sırasında bir hata oluştu.' });
  }
}