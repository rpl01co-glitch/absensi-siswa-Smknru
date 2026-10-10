import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL', err);
    return '';
  }
}

export async function generateQrSvgString(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code SVG', err);
    return '';
  }
}
