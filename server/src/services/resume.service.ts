import pdfParse from 'pdf-parse';

export class ResumeService {
  static async extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text ? data.text.trim() : '';
      if (!text) {
        throw new Error('No selectable text found in the PDF document.');
      }
      return text;
    } catch (error: any) {
      console.error('PDF parsing error:', error);
      throw new Error(error.message || 'Failed to extract text from PDF document');
    }
  }
}
