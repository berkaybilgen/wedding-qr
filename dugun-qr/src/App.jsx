import React, { useState } from 'react';

export default function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setStatusMessage('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setStatusMessage('Lütfen en az bir fotoğraf seçin.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setStatusMessage('Fotoğraflarınız yükleniyor, lütfen bekleyin...');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('file', file);
    });

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');

        // Yükleme ilerlemesi (dosyalar tarayıcıdan sunucuya giderken)
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
            // %100'e ulaşınca dosyalar sunucuya ulaştı, Drive'a aktarılıyor demektir
            if (percent >= 100) {
              setStatusMessage('Son işlemler yapılıyor, lütfen bekleyin...');
            }
          }
        };

        xhr.onload = () => {
          let result = {};
          try {
            result = JSON.parse(xhr.responseText);
          } catch {
            // yanıt JSON değilse boş bırak
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            setStatusMessage('🎉 Harika! Fotoğraflarınız başarıyla yüklendi. Çok teşekkür ederiz!');
            setSelectedFiles([]);
            resolve();
          } else {
            setStatusMessage(`❌ Bir hata oluştu: ${result.error || 'Tekrar deneyin.'}`);
            reject(new Error(result.error || 'upload failed'));
          }
        };

        xhr.onerror = () => {
          setStatusMessage('❌ Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
          reject(new Error('network error'));
        };

        xhr.send(formData);
      });
    } catch {
      // durum mesajı yukarıda ayarlandı
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/names.png" alt="Elif & Berkay" style={styles.names} />
        <h1 style={styles.title}>📸 Hoş Geldiniz!</h1>
        <p style={styles.subtitle}>
          En güzel anılarımızı bizimle paylaşmak için fotoğraflarınızı aşağıdan yükleyebilirsiniz.
        </p>

        <form onSubmit={handleUpload} style={styles.form}>
          <label htmlFor="file-input" style={styles.fileLabel}>
            {selectedFiles.length > 0 
              ? `📸 ${selectedFiles.length} Fotoğraf Seçildi` 
              : '📁 Fotoğraf / Video Seç'}
          </label>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            type="submit"
            disabled={uploading || selectedFiles.length === 0}
            style={{
              ...styles.button,
              opacity: (uploading || selectedFiles.length === 0) ? 0.6 : 1
            }}
          >
            {uploading ? `Yükleniyor... %${progress}` : 'Gönder'}
          </button>
        </form>

        {uploading && (
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
          </div>
        )}

        {statusMessage && <p style={styles.status}>{statusMessage}</p>}
      </div>
    </div>
  );
}

// Basit ve Mobil Uyumlu Inline Stiller
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fffdf7',
    backgroundImage: "url('/background.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'sans-serif',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '30px 20px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  names: { width: '80%', maxWidth: '260px', height: 'auto', display: 'block', margin: '0 auto 16px' },
  title: { fontSize: '24px', color: '#2c3e50', marginBottom: '10px' },
  subtitle: { fontSize: '14px', color: '#666', marginBottom: '25px', lineHeight: '1.5' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  fileLabel: {
    padding: '14px',
    backgroundColor: '#eef2f5',
    color: '#334155',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    border: '2px dashed #cbd5e1',
  },
  button: {
    padding: '14px',
    backgroundColor: '#675815',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  status: { marginTop: '20px', fontSize: '14px', color: '#2c3e50', fontWeight: '500' },
  progressWrap: {
    marginTop: '18px',
    width: '100%',
    height: '10px',
    backgroundColor: '#eef2f5',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#675815',
    borderRadius: '999px',
    transition: 'width 0.25s ease',
  }
};