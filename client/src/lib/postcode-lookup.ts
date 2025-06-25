export function validateAndLookupPostcode(postcode: string): string {
  const cleaned = postcode.replace(/\s+/g, '').toUpperCase();

  if (cleaned.startsWith('SO23')) return 'Winchester';
  if (cleaned.startsWith('SP10')) return 'Andover';
  if (cleaned.startsWith('RG22')) return 'Basingstoke';

  return 'Unknown';
} 