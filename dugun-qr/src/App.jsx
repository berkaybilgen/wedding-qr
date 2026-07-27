import React, { useState } from 'react';

export default function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
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
    setStatusMessage('Fotoğraflarınız yükleniyor, lütfen bekleyin...');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('file', file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage('🎉 Harika! Fotoğraflarınız başarıyla yüklendi. Çok teşekkür ederiz!');
        setSelectedFiles([]);
      } else {
        setStatusMessage(`❌ Bir hata oluştu: ${result.error || 'Tekrar deneyin.'}`);
      }
    } catch (err) {
      setStatusMessage('❌ Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
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
            {uploading ? 'Yükleniyor...' : 'Gönder'}
          </button>
        </form>

        {statusMessage && <p style={styles.status}>{statusMessage}</p>}
      </div>
    </div>
  );
}

// Basit ve Mobil Uyumlu Inline Stiller
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f4f1ea',
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
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  status: { marginTop: '20px', fontSize: '14px', color: '#2c3e50', fontWeight: '500' }
};