import { BUILD_INFO } from '../constants/build';

interface ReportExportInput {
  reportCsv: string;
  reportTitle: string;
  dateRangeLabel: string;
  generatedAt: string;
  logoUri?: string;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function csvPreview(reportCsv: string, maxLines = 16) {
  return reportCsv
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);
}

export function buildExcelCompatibleReport(input: ReportExportInput) {
  return [
    `Finance Tracker ${BUILD_INFO.appVersion}`,
    input.reportTitle,
    `Date range,${input.dateRangeLabel}`,
    `Generated,${input.generatedAt}`,
    `Build,${BUILD_INFO.label} (${BUILD_INFO.buildId})`,
    '',
    input.reportCsv,
  ].join('\n');
}

export function buildReportImageSvg(input: ReportExportInput) {
  const rows = csvPreview(input.reportCsv, 10);
  const watermark = input.logoUri
    ? `<image href="${escapeXml(input.logoUri)}" x="270" y="112" width="220" height="220" opacity="0.10" />`
    : `<text x="300" y="210" fill="#16A7A0" opacity="0.10" font-size="72" font-weight="900">FT</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960">
  <rect width="720" height="960" rx="32" fill="#F7F8FC"/>
  <rect x="40" y="40" width="640" height="880" rx="28" fill="#FFFFFF" stroke="#E7EAF1"/>
  ${watermark}
  <text x="72" y="96" fill="#171821" font-size="30" font-weight="900">Finance Tracker</text>
  <text x="72" y="132" fill="#16A7A0" font-size="18" font-weight="800">${escapeXml(input.reportTitle)}</text>
  <text x="72" y="164" fill="#6D7182" font-size="15">Range: ${escapeXml(input.dateRangeLabel)}</text>
  <text x="72" y="190" fill="#6D7182" font-size="15">Generated: ${escapeXml(input.generatedAt)}</text>
  <text x="72" y="216" fill="#6D7182" font-size="15">${escapeXml(BUILD_INFO.shortLabel)}</text>
  ${rows
    .map(
      (row, index) =>
        `<text x="72" y="${278 + index * 32}" fill="${index === 0 ? '#171821' : '#334155'}" font-size="15" font-weight="${index === 0 ? 900 : 700}">${escapeXml(row).slice(0, 96)}</text>`
    )
    .join('\n  ')}
  <text x="72" y="880" fill="#94A3B8" font-size="13">Watermarked with the app logo. SVG image export is used for Expo-safe sharing.</text>
</svg>`;
}

export function buildReportPdf(input: ReportExportInput) {
  const lines = [
    'Finance Tracker',
    input.reportTitle,
    `Date range: ${input.dateRangeLabel}`,
    `Generated: ${input.generatedAt}`,
    `${BUILD_INFO.shortLabel}`,
    `Build ID: ${BUILD_INFO.buildId}`,
    'Logo watermark: app icon asset',
    '',
    ...csvPreview(input.reportCsv, 22),
  ];
  const content = [
    'BT',
    '/F1 20 Tf',
    '54 760 Td',
    `(${escapePdfText(lines[0])}) Tj`,
    '/F1 11 Tf',
    ...lines.slice(1).flatMap((line) => ['0 -24 Td', `(${escapePdfText(line)}) Tj`]),
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}
