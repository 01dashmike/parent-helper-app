// Google Sheets integration utilities
// In production, this would handle Google Sheets API integration

export interface SheetsClassData {
  town: string;
  name: string;
  ageRange: string;
  time: string;
  cost: string;
  link: string;
  tags: string;
}

export class GoogleSheetsAPI {
  private apiKey: string;
  private sheetId: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || process.env.GOOGLE_SHEETS_API_KEY || '';
    this.sheetId = '1Eu-Ei6Pou3Q1K9wsVeoxpQNWSfT-bvNXiYNckZAq2u4';
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
      // Column order from your sheet: Town, Class Name, Age Range, Time, Cost, Link, Tags
      return {
        town: row[0] || '',
        name: row[1] || '',
        ageRange: row[2] || '',
        time: row[3] || '',
        cost: row[4] || '',
        link: row[5] || '',
        tags: row[6] || '',
      };
    }).filter(item => item.name && item.town); // Filter out invalid rows
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
