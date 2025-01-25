import * as FileSystem from 'expo-file-system';
import { OCR_SPACE_API_KEY } from '@env';

export async function extractPriceFromImage(imageUri: string): Promise<number | null> {
  try {
    // Read the image file
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('Image loaded, attempting OCR...');

    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('scale', 'true');
    formData.append('detectOrientation', 'true');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': OCR_SPACE_API_KEY,
      },
      body: formData,
    });

    const data = await response.json();
    console.log('OCR Response:', data);

    if (data.ParsedResults && data.ParsedResults.length > 0) {
      const text = data.ParsedResults[0].ParsedText;
      console.log('Extracted text:', text);

      // Look for price patterns (e.g., $XX.XX)
      const priceRegex = /\$\d+\.\d{2}/g;
      const matches = text.match(priceRegex);
      console.log('Price matches:', matches);

      if (matches && matches.length > 0) {
        const price = parseFloat(matches[0].replace('$', ''));
        console.log('Final extracted price:', price);
        return price;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting price:', error);
    return null;
  }
}