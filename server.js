// Backend simples com Express.js e pdf-lib para editar e desbloquear PDFs
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(fileUpload());
app.use(express.json());

app.post('/upload', async (req, res) => {
  if (!req.files || !req.files.pdf) {
    return res.status(400).send('Nenhum arquivo enviado.');
  }
  const pdfFile = req.files.pdf;
  const filePath = `./uploads/${pdfFile.name}`;

  await pdfFile.mv(filePath);
  res.send({ message: 'Arquivo recebido com sucesso.', filename: pdfFile.name });
});

app.post('/desbloquear', (req, res) => {
  const { filename } = req.body;
  const inputPath = `./uploads/${filename}`;
  const outputPath = `./outputs/unlocked-${filename}`;

  exec(`qpdf --decrypt "${inputPath}" "${outputPath}"`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send({ error: 'Erro ao desbloquear o PDF.' });
    }
    res.download(outputPath);
  });
});

app.post('/adicionar-texto', async (req, res) => {
  const { filename, texto } = req.body;
  const inputPath = `./uploads/${filename}`;
  const outputPath = `./outputs/editado-${filename}`;

  const existingPdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  firstPage.drawText(texto || 'Texto Adicionado', {
    x: 50,
    y: 700,
    size: 18,
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  res.download(outputPath);
});

app.listen(3001, () => console.log('Servidor rodando em http://localhost:3001'));
