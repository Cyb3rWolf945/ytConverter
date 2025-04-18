const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ytdlp = require('yt-dlp-exec');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Criar diretório para downloads se não existir
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Função para limpar arquivos antigos
const cleanOldFiles = () => {
  const files = fs.readdirSync(downloadsDir);
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hora em milissegundos

  files.forEach(file => {
    const filePath = path.join(downloadsDir, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtime.getTime() > oneHour) {
      fs.unlinkSync(filePath);
    }
  });
};

app.post('/convert', async (req, res) => {
  const { url } = req.body;

  try {
    // Limpar arquivos antigos antes de cada nova conversão
    cleanOldFiles();

    // Gerar timestamp único
    const timestamp = Date.now();
    
    // Configurar opções para download e conversão
    const outputPath = path.join(downloadsDir, `%(title)s_${timestamp}.mp3`);
    
    // Usar yt-dlp-exec para download e conversão
    const result = await ytdlp(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0,
      output: outputPath,
      preferFfmpeg: true
    });

    console.log('Download concluído:', result);

    // Procurar o arquivo mais recente na pasta de downloads
    const files = fs.readdirSync(downloadsDir);
    const mp3Files = files.filter(file => file.endsWith('.mp3'));
    
    if (mp3Files.length > 0) {
      // Ordenar por data de modificação (mais recente primeiro)
      const sortedFiles = mp3Files.sort((a, b) => {
        const statA = fs.statSync(path.join(downloadsDir, a));
        const statB = fs.statSync(path.join(downloadsDir, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      });

      const filename = sortedFiles[0];
      console.log('Arquivo encontrado:', filename);
      
      res.json({ 
        success: true, 
        message: 'Conversão concluída com sucesso!',
        file: filename
      });
    } else {
      console.error('Nenhum arquivo MP3 encontrado');
      res.status(500).json({ error: 'Nenhum arquivo MP3 foi gerado' });
    }

  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ error: 'Erro ao processar o vídeo: ' + err.message });
  }
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(downloadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Erro ao enviar arquivo:', err);
        res.status(500).json({ error: 'Erro ao enviar arquivo' });
      }
    });
  } else {
    res.status(404).json({ error: 'Arquivo não encontrado' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
}); 