import { localhost } from "../../api";

export const generateQRCode = async (userId: number, setQrCodeUrl: Function) => {
    // Generate the 2FA QR Code
    const response = await fetch(`http://${localhost}:3333/auth/2fa/generateQR`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message);
    }

    const qrCodeUrl = await response.text();

    setQrCodeUrl(qrCodeUrl);
};