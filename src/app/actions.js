'use server'

import { scanWallet } from '@/lib/demonEngine';

export async function performScan(formData) {
  const address = formData.get('walletAddress');
  
  if (!address) {
    return { error: 'Wallet address is required' };
  }

  try {
    const data = await scanWallet(address);
    // Next.js cannot serialize complex objects like Sets/Maps easily, 
    // but our engine returns standard JSON, so we are good.
    return { success: true, data: data };
  } catch (e) {
    console.error("Scan Error:", e);
    return { error: 'Failed to scan wallet. Check address.' };
  }
}