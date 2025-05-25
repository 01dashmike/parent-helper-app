// Google Sheets integration utilities
// In production, this would handle Google Sheets API integration

export interface SheetsClassData {
  name: string;
  description: string;
  ageMin: number;
  ageMax: number;
  price?: string;
  venue: string;
  address: string;
  postcode: string;
  dayOfWeek: string;
  time: string;
  category: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isFeatured?: boolean;
}

export class GoogleSheetsAPI {
  private apiKey: string;
  private sheetId: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || process.env.GOOGLE_SHEETS_API_KEY || '';
    this.sheetId = import.meta.env.VITE_GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEETS_ID || '';
  }

  async fetchClassData(): Promise<SheetsClassData[]> {
    if (!this.apiKey || !this.sheetId) {
      console.warn('Google Sheets API key or Sheet ID not configured');
      return [];
    }

    try {
      const range = 'Classes!A2:Z1000'; // Assuming headers in row 1
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${range}?key=${this.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      return this.parseSheetData(rows);
    } catch (error) {
      console.error('Failed to fetch Google Sheets data:', error);
      return [];
    }
  }

  private parseSheetData(rows: string[][]): SheetsClassData[] {
    return rows.map((row) => {
      // Assuming column order: Name, Description, AgeMin, AgeMax, Price, Venue, Address, Postcode, Day, Time, Category, Email, Phone, Website, Featured
      return {
        name: row[0] || '',
        description: row[1] || '',
        ageMin: parseInt(row[2]) || 0,
        ageMax: parseInt(row[3]) || 60,
        price: row[4] || undefined,
        venue: row[5] || '',
        address: row[6] || '',
        postcode: row[7] || '',
        dayOfWeek: row[8] || '',
        time: row[9] || '',
        category: row[10] || 'general',
        contactEmail: row[11] || undefined,
        contactPhone: row[12] || undefined,
        website: row[13] || undefined,
        isFeatured: row[14]?.toLowerCase() === 'true' || false,
      };
    }).filter(item => item.name && item.postcode); // Filter out invalid rows
  }

  async syncWithDatabase(): Promise<void> {
    try {
      const sheetData = await this.fetchClassData();
      
      // In a real implementation, this would sync with your database
      // For now, we'll just log the data
      console.log('Synced class data from Google Sheets:', sheetData.length, 'classes');
      
      // You could post this data to your backend API to update the database
      // await fetch('/api/classes/sync', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(sheetData)
      // });
      
    } catch (error) {
      console.error('Failed to sync with Google Sheets:', error);
      throw error;
    }
  }
}

export const googleSheets = new GoogleSheetsAPI();
