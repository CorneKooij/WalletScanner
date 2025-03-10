import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const apiKey = process.env.BLOCKFROST_API_KEY;
if (!apiKey) {
  throw new Error('BLOCKFROST_API_KEY environment variable is not set');
}

const blockfrost = new BlockFrostAPI({
  projectId: apiKey,
  // Using mainnet by default, but this could be configurable
  network: 'mainnet',
});

// Add logging for development
const logApiCall = (method: string, ...args: any[]) => {
  console.log(`[Blockfrost API] Calling ${method} with args:`, ...args);
};

export async function getWalletInfo(address: string) {
  try {
    logApiCall('getWalletInfo', address);
    
    // Get address details
    const addressInfo = await blockfrost.addresses(address);
    console.log('[Blockfrost] Address info:', addressInfo);
    
    // Get transaction history
    const transactions = await blockfrost.addressesTransactions(address, {
      count: 20, // Limit to latest 20 transactions
      order: 'desc'
    });
    console.log('[Blockfrost] Found transactions:', transactions.length);

    // Get asset balances using UTXO information
    const utxos = await blockfrost.addressesUtxos(address);
    console.log('[Blockfrost] Found UTXOs:', utxos.length);

    // Aggregate token amounts from UTXOs
    const tokenMap = new Map<string, string>();
    utxos.forEach(utxo => {
      utxo.amount.forEach(amt => {
        const current = tokenMap.get(amt.unit) || '0';
        const newAmount = (BigInt(current) + BigInt(amt.quantity)).toString();
        tokenMap.set(amt.unit, newAmount);
      });
    });

    // Format the response
    return {
      address,
      balance: addressInfo.amount[0].quantity, // Amount in Lovelace (1 ADA = 1,000,000 Lovelace)
      tokens: Array.from(tokenMap.entries()).map(([unit, quantity]) => ({
        unit,
        quantity
      })),
      transactions: transactions.map(tx => ({
        hash: tx.tx_hash,
        blockHeight: tx.block_height,
        blockTime: tx.block_time,
      })),
    };
  } catch (error: any) {
    console.error('[Blockfrost] Error in getWalletInfo:', error);
    if (error.status_code === 404) {
      throw new Error('Wallet address not found');
    }
    throw error;
  }
}

export async function getTokenMetadata(unit: string) {
  try {
    logApiCall('getTokenMetadata', unit);
    const assetInfo = await blockfrost.assetsById(unit);
    console.log('[Blockfrost] Asset info:', assetInfo);
    
    return {
      name: assetInfo.asset_name || '',
      symbol: assetInfo.asset || '',
      decimals: 0, // Blockfrost doesn't provide decimals directly
      description: assetInfo.onchain_metadata?.description || '',
    };
  } catch (error: any) {
    console.error(`Error fetching token metadata for ${unit}:`, error);
    return null;
  }
}

export async function getTransactionDetails(hash: string) {
  try {
    const txInfo = await blockfrost.txs(hash);
    const txUtxos = await blockfrost.txsUtxos(hash);
    
    return {
      hash,
      blockHeight: txInfo.block_height,
      blockTime: txInfo.block_time,
      fees: txInfo.fees,
      inputs: txUtxos.inputs,
      outputs: txUtxos.outputs,
    };
  } catch (error) {
    console.error(`Error fetching transaction details for ${hash}:`, error);
    throw error;
  }
}