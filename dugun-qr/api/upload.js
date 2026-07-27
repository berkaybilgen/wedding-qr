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
        requestBody: fileMetadata, // Not: 'resource' yerine yeni SDK'larda 'requestBody' kullanılır
        media: media,
        supportsAllDrives: true,    // <-- KRİTİK: Shared drive / paylaşımlı klasör desteğini açar
        fields: 'id',
      });
    });