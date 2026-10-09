/**
 * pdfExport.js
 * Shared utilities for branded PDF exports.
 */

/**
 * Draws the TransDiesel branded header on the first page of a jsPDF document.
 * Returns the Y position after the header (where table should start).
 *
 * @param {import('jspdf').jsPDF} doc
 * @param {string} title  - Report title, e.g. "Service Orders"
 * @param {string} [subtitle] - Optional subtitle line
 * @returns {Promise<number>} startY for autoTable
 */
export async function buildPdfHeader(doc, title, subtitle = '') {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Dark header bar ──────────────────────────────────────────
  doc.setFillColor(26, 58, 108);           // #1a3a6c
  doc.rect(0, 0, pageW, 22, 'F');

  // ── Logo ─────────────────────────────────────────────────────
  try {
    const img = await loadImageAsBase64('/td_logo.png');
    doc.addImage(img, 'PNG', margin, 2, 18, 18);
  } catch {
    // If logo fails, skip silently
  }

  // ── Title text ───────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TransDiesel EMS', margin + 22, 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(title, margin + 22, 16);

  // ── Date top-right ───────────────────────────────────────────
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, pageW - margin, 15, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  // ── Optional subtitle below header bar ───────────────────────
  let y = 28;
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 65, 85);
    doc.text(subtitle, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 7;
  }

  return y;
}

/**
 * Adds page numbering and footer to all pages of the document.
 * @param {import('jspdf').jsPDF} doc
 */
export function addPdfFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('TransDiesel EMS — Confidential Service Report', margin, pageH - 6);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 6, { align: 'right' });
  }
}

/**
 * Loads an image URL and returns a base64 data URL.
 */
function loadImageAsBase64(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** Standard table styles for all PDF exports */
export const PDF_TABLE_STYLES = {
  styles: {
    fontSize: 8,
    cellPadding: 3.5,
    overflow: 'linebreak',
    valign: 'middle',
    textColor: [30, 41, 59],
  },
  headStyles: {
    fillColor: [26, 58, 108],
    textColor: 255,
    fontStyle: 'bold',
    fontSize: 8.5,
    cellPadding: 4,
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252],
  },
  margin: { left: 14, right: 14, bottom: 18 },
};

