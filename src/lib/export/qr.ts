import QRCode from 'qrcode'

export async function generateQR(url: string): Promise<Buffer> {
  const buffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#C9A84C', light: '#09090A' },
  })
  return buffer
}
