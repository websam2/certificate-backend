const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// Rota para buscar certificados
app.get('/api/certificates', async (req, res) => {
  const { query } = req.query;
  try {
    const certificates = await prisma.certificate.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rota para download do certificado em PDF
app.get('/api/certificates/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    const certificate = await prisma.certificate.findUnique({ where: { id } });
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Criar PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(`Certificate of Completion`, {
      x: 50,
      y: height - 100,
      size: 30,
      font,
      color: rgb(0, 0, 0),
    });

    // Adicionar mais detalhes do certificado aqui...

    const pdfBytes = await pdfDoc.save();
    res.contentType('application/pdf');
    res.send(Buffer.from(pdfBytes));

    // Log da requisição de download
    console.log(`Certificate downloaded: ${id} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});