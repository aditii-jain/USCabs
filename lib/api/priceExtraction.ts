import * as FileSystem from 'expo-file-system';

// Remove @env import and use process.env directly
const apiKey = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;

export async function extractPriceFromImage(imageUri: string): Promise<number | null> {
  try {
    // Read the image file
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('scale', 'true');
    formData.append('detectOrientation', 'true');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': apiKey || '',
        'Content-Type': 'multipart/form-data'
      },
      body: formData,
    });

    const data = await response.json();

    if (data.ParsedResults && data.ParsedResults.length > 0) {
      const text = data.ParsedResults[0].ParsedText;

      // Look for price patterns (e.g., $XX.XX)
      const priceRegex = /\$\d+\.\d{2}/g;
      const matches = text.match(priceRegex);

      if (matches && matches.length > 0) {
        const price = parseFloat(matches[0].replace('$', ''));
        return price;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting price:', error);
    return null;
  }
}