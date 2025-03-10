import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const apiKey = process.env.BLOCKFROST_API_KEY;
if (!apiKey) {
  throw new Error('BLOCKFROST_API_KEY environment variable is not set');
}

const blockfrost = new BlockFrostAPI({
  projectId: apiKey,
});

export async function getWalletInfo(address: string) {
  try {
    // Get address details
    const addressInfo = await blockfrost.addresses(address);
    
    // Get transaction history
    const transactions = await blockfrost.addressesTransactions(address, {
      count: 20, // Limit to latest 20 transactions
      order: 'desc'
    });

    // Get asset balances
    const assets = await blockfrost.addressesUtxos(address, { 
      count: 100, // Limit to latest 100 UTXOs
      page: 1 
    });

    // Format the response
    return {
      address,
      balance: addressInfo.amount[0].quantity, // Amount in Lovelace (1 ADA = 1,000,000 Lovelace)
      tokens: assets.flatMap(utxo => 
        utxo.amount.map(amt => ({
          unit: amt.unit,
          quantity: amt.quantity,
        }))
      ),
      transactions: transactions.map(tx => ({
        hash: tx.tx_hash,
        blockHeight: tx.block_height,
        blockTime: tx.block_time,
      })),
    };
  } catch (error: any) {
    if (error.status_code === 404) {
      throw new Error('Wallet address not found');
    }
    throw error;
  }
}

export async function getTokenMetadata(unit: string) {
  try {
    const assetInfo = await blockfrost.assetsById(unit);
    
    return {
      name: assetInfo.assetName || '',
      symbol: assetInfo.asset || '',
      decimals: 0, // Blockfrost doesn't provide decimals directly
      description: assetInfo.metadata?.description || '',
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