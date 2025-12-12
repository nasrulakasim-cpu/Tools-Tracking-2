import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MovementRequest, InventoryItem, RequestType } from '../types';

export const generateQF21 = (request: MovementRequest, items: InventoryItem[], storekeeperName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width; // 210mm
  const pageHeight = doc.internal.pageSize.height; // 297mm
  
  // --- HEADER ---
  const startX = 14;
  const startY = 10;

  // 1. Logo Icon (Red Lightbulb/Lightning)
  const iconX = startX;
  const iconY = startY;
  
  doc.setDrawColor(220, 53, 69); // Red #dc3545
  doc.setLineWidth(1.2);
  
  // Bulb Head
  doc.line(iconX, iconY, iconX + 8, iconY); // Top flat
  doc.line(iconX, iconY, iconX, iconY + 7); // Left
  doc.line(iconX + 8, iconY, iconX + 8, iconY + 7); // Right
  doc.line(iconX, iconY + 7, iconX + 2, iconY + 11); // Taper Left
  doc.line(iconX + 8, iconY + 7, iconX + 6, iconY + 11); // Taper Right
  doc.line(iconX + 2, iconY + 11, iconX + 6, iconY + 11); // Bottom Base
  
  // Lightning Bolt
  doc.setLineWidth(0.8);
  doc.lines([[3, 0], [-1.5, 3], [1.5, 0], [-3, 4]], iconX + 2.5, iconY + 1.5, [0.8, 0.8], 'S', true);
  
  // Base lines
  doc.setLineWidth(0.4);
  doc.line(iconX + 2, iconY + 12, iconX + 6, iconY + 12);

  // 2. Logo Text: REMACO (Blue)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(40, 80, 160); // Blue
  doc.text('REMACO', iconX + 12, iconY + 8);
  
  // 3. Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text('A subsidiary of TNB Power Generation', iconX + 12, iconY + 12);

  // 4. Form Title (Center)
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const title = 'PERALATAN KELUAR/MASUK';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, iconY + 8);

  // 5. Form ID (Right)
  doc.setFontSize(10);
  doc.text('QF.100', pageWidth - 14, iconY + 8, { align: 'right' });

  // 6. Header Separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(10, 26, pageWidth - 10, 26); 

  // --- INFO FIELDS ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const infoY = 32;
  const lineHeight = 6; 
  
  const drawField = (label: string, value: string, y: number) => {
     doc.text(label, 14, y);
     doc.text(':', 55, y);
     doc.text(value.toUpperCase(), 58, y);
     doc.setLineWidth(0.1);
     doc.line(58, y + 1, pageWidth - 14, y + 1); // Underline
  };

  // Fields
  drawField('MARKAS/ WORKSHOP', request.base, infoY);
  drawField('NO. KERJA', `${request.staffName} (${request.staffId})`, infoY + lineHeight);
  drawField('PROJEK', request.targetLocation || '-', infoY + (lineHeight * 2));

  // --- MAIN TABLE (21 Rows strict) ---
  const isBorrow = request.type === RequestType.BORROW;
  const isReturn = request.type === RequestType.RETURN;
  const MAX_ROWS = 21;
  const tableBody = [];

  for (let i = 0; i < MAX_ROWS; i++) {
    if (i < request.items.length) {
      const reqItem = request.items[i];
      tableBody.push([
        i + 1,
        `${reqItem.description}\nS/N: ${reqItem.serialNo}`, 
        '', 
        isBorrow ? '1' : '', 
        '', 
        isReturn ? '1' : '' 
      ]);
    } else {
      tableBody.push(['', '', '', '', '', '']);
    }
  }

  // TIGHT TABLE SETTINGS TO FIT PAGE
  autoTable(doc, {
    startY: infoY + (lineHeight * 3) + 4,
    head: [[
      'BIL.', 
      'PERALATAN', 
      'CATATAN', 
      'KUANTITI\nKELUAR', 
      'TARIKH\nDIPULANGKAN', 
      'KUANTITI\nMASUK'
    ]],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7, // Small font
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      valign: 'middle',
      cellPadding: 1,
      minCellHeight: 6.5 // Controls row height. 21 * 6.5 = ~136mm
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      fontSize: 7
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // Bil
      1: { cellWidth: 'auto' }, // Peralatan
      2: { cellWidth: 40 }, // Catatan
      3: { cellWidth: 18, halign: 'center' }, // Out
      4: { cellWidth: 22, halign: 'center' }, // Date Return
      5: { cellWidth: 18, halign: 'center' } // In
    },
    margin: { left: 10, right: 10 },
    pageBreak: 'avoid'
  });

  // --- BOTTOM SECTION ---
  // @ts-ignore
  const tableEndY = doc.lastAutoTable.finalY;
  
  // 1. Catatan Box
  const catatanY = tableEndY + 2;
  const catatanHeight = 12;
  
  doc.setLineWidth(0.1);
  doc.rect(10, catatanY, pageWidth - 20, catatanHeight); // Box
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CATATAN :', 12, catatanY + 4);

  // 2. Signature Table
  const sigStartY = catatanY + catatanHeight; // Immediately after Catatan box
  
  // Prepare Signature Rows
  const staffSign = `${request.staffName.toUpperCase()}\n\n\n____________________`;
  const storeSign = `${storekeeperName.toUpperCase()}\n\n\n____________________`;
  const emptySign = '\n\n\n____________________'; 

  // Row 1: DIKELUARKAN
  const sigRow1 = isBorrow 
    ? [ 'DIKELUARKAN', emptySign, staffSign, storeSign ]
    : [ 'DIKELUARKAN', '', '', '' ];
    
  // Row 2: DIPULANGKAN
  const sigRow2 = isReturn
    ? [ 'DIPULANGKAN', emptySign, staffSign, storeSign ]
    : [ 'DIPULANGKAN', '', '', '' ];

  autoTable(doc, {
    startY: sigStartY,
    head: [[
      '', 
      'NAMA DAN T/TANGAN JURUTERA KANAN MARKAS /\nPENGURUS KANAN WORKSHOP / ODK',
      'NAMA DAN T/TANGAN PENGGUNA\n(PENGURUS KERJA/ POMEN/ KETUA KUMPULAN)',
      'NAMA & T/TANGAN PENJAGA PERALATAN MARKAS /\nWORKSHOP'
    ]],
    body: [
      sigRow1,
      sigRow2
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6, // Very small for headers
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      valign: 'bottom',
      halign: 'center',
      cellPadding: 1,
      minCellHeight: 20 // Fixed height for signature rows
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      valign: 'middle',
      fontSize: 6, // Small header font
      cellPadding: 1
    },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: 'bold', valign: 'middle', halign: 'center' }, // Label
      1: { cellWidth: 55 },
      2: { cellWidth: 55 },
      3: { cellWidth: 55 }
    },
    margin: { left: 10, right: 10 },
    pageBreak: 'avoid'
  });

  // Footer Metadata (Absolute bottom)
  const bottomY = pageHeight - 6;
  doc.setFontSize(6);
  doc.text('*ODK: Orang Diberi Kuasa', 10, bottomY - 3);
  doc.text('Revision: 0   Date of Issue: 22.03.2023', 10, bottomY);

  doc.save(`QF100_${request.type}_${request.id}.pdf`);
};