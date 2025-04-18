import React, { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setProgress(0);
    setSuccess(false);

    try {
      // Enviar requisição para o backend
      const response = await fetch('http://localhost:3001/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao converter o vídeo');
      }

      // Iniciar download do arquivo
      const downloadResponse = await fetch(`http://localhost:3001/download/${data.file}`);
      const blob = await downloadResponse.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = data.file;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess(true);
      setLoading(false);
      setUrl(''); // Limpar o campo de URL após o sucesso

    } catch (err) {
      setError('Erro ao processar o vídeo: ' + (err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>YouTube para MP3</h1>
        <form onSubmit={handleSubmit} className="converter-form">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole a URL do vídeo do YouTube aqui"
            className="url-input"
            required
            disabled={loading}
          />
          <button 
            type="submit" 
            className="convert-button"
            disabled={loading}
          >
            {loading ? 'Convertendo...' : 'Converter para MP3'}
          </button>
          {loading && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          {success && (
            <p style={{ color: 'var(--success-color)', marginTop: '15px' }}>
              Conversão concluída com sucesso! O download começará automaticamente.
            </p>
          )}
          {error && <p className="error-message">{error}</p>}
        </form>
      </header>
    </div>
  );
}

export default App;
