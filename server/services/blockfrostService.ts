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

    // Get token metadata for each token
    const tokens = [];
    const tokenEntries = Array.from(tokenMap.entries());
    for (const [unit, quantity] of tokenEntries) {
      if (unit === 'lovelace') {
        tokens.push({
          unit,
          quantity,
          name: 'Cardano',
          symbol: 'ADA',
          displayDecimals: 6
        });
      } else {
        try {
          // Only fetch metadata for non-ADA tokens
          const metadata = await blockfrost.assetsById(unit);
          console.log(`[Blockfrost] Metadata for ${unit}:`, metadata);
          
          // Get the onchain policy and asset name parts from the unit
          const policyId = unit.slice(0, 56);
          const assetNameHex = unit.slice(56);
          
          // Try to decode asset name from hex
          let assetName;
          try {
            if (assetNameHex) {
              assetName = Buffer.from(assetNameHex, 'hex').toString();
            }
          } catch (e) {
            console.log(`[Blockfrost] Could not decode asset name for ${unit}:`, e);
            assetName = assetNameHex;
          }
          
          tokens.push({
            unit,
            quantity,
            name: metadata.metadata?.name || assetName || metadata.asset_name || unit.slice(0, 10) + '...',
            symbol: metadata.metadata?.ticker || (metadata.asset_name ? metadata.asset_name.slice(0, 5) : unit.slice(0, 5)),
            decimals: metadata.metadata?.decimals || 0,
            policyId
          });
        } catch (error) {
          console.log(`[Blockfrost] Error fetching metadata for ${unit}:`, error);
          tokens.push({
            unit,
            quantity,
            name: unit.slice(0, 15) + '...',
            symbol: unit.slice(0, 5),
            decimals: 0
          });
        }
      }
    }

    // Format the response
    return {
      address,
      balance: addressInfo.amount[0].quantity, // Amount in Lovelace (1 ADA = 1,000,000 Lovelace)
      tokens,
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

export async function getTransactionDetails(hash: string, walletAddress: string = '') {
  try {
    logApiCall('getTransactionDetails', hash, walletAddress);
    const txInfo = await blockfrost.txs(hash);
    const txUtxos = await blockfrost.txsUtxos(hash);
    
    // Normalize wallet address for comparison (lowercase)
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Check if this wallet is an input (sending) or output (receiving)
    let type = 'transfer'; // Default type
    let amount = '0';
    let tokenSymbol = 'ADA';
    let tokenAmount = '0';
    
    // Check if wallet is in inputs (sending)
    const isInput = txUtxos.inputs.some(input => 
      input.address && input.address.toLowerCase() === normalizedWalletAddress
    );
    
    // Check if wallet is in outputs (receiving)
    const isOutput = txUtxos.outputs.some(output => 
      output.address && output.address.toLowerCase() === normalizedWalletAddress
    );
    
    // Calculate amount based on inputs and outputs for this wallet
    let inputTotal = BigInt(0);
    let outputTotal = BigInt(0);
    
    // Sum up inputs from this wallet
    txUtxos.inputs.forEach(input => {
      if (input.address && input.address.toLowerCase() === normalizedWalletAddress) {
        input.amount.forEach(amt => {
          if (amt.unit === 'lovelace') {
            inputTotal += BigInt(amt.quantity);
          }
        });
      }
    });
    
    // Sum up outputs to this wallet
    txUtxos.outputs.forEach(output => {
      if (output.address && output.address.toLowerCase() === normalizedWalletAddress) {
        output.amount.forEach(amt => {
          if (amt.unit === 'lovelace') {
            outputTotal += BigInt(amt.quantity);
          }
        });
      }
    });
    
    // Determine transaction type and amount
    if (isInput && isOutput) {
      // This is a self-transfer
      if (inputTotal > outputTotal) {
        type = 'sent';
        amount = (inputTotal - outputTotal).toString();
      } else if (outputTotal > inputTotal) {
        type = 'received';
        amount = (outputTotal - inputTotal).toString();
      } else {
        type = 'self-transfer';
        amount = '0'; // Net transfer amount is 0
      }
    } else if (isInput) {
      // This wallet is sending ADA
      type = 'sent';
      amount = inputTotal.toString();
    } else if (isOutput) {
      // This wallet is receiving ADA
      type = 'received';
      amount = outputTotal.toString();
    }
    
    // Check for stake rewards
    try {
      const txMetadata = await blockfrost.txsMetadata(hash);
      if (txMetadata && txMetadata.length > 0) {
        const isStakeReward = txMetadata.some((m: any) => 
          m.label === '1990' || m.label === 'stake' || 
          (m.json_metadata && JSON.stringify(m.json_metadata).toLowerCase().includes('stake'))
        );
        
        if (isStakeReward) {
          type = 'stake_reward';
        }
      }
    } catch (metadataError) {
      console.log(`[Blockfrost] No metadata for transaction ${hash}:`, metadataError);
      // Continue without metadata - not critical
    }
    
    // Get transaction counterparty (the other address, if not self)
    let counterpartyAddress = null;
    if (type === 'sent') {
      // Find recipient if we're sending (first non-self output)
      const output = txUtxos.outputs.find(out => 
        out.address && out.address.toLowerCase() !== normalizedWalletAddress
      );
      if (output) {
        counterpartyAddress = output.address;
      }
    } else if (type === 'received') {
      // Find sender if we're receiving (first non-self input)
      const input = txUtxos.inputs.find(inp => 
        inp.address && inp.address.toLowerCase() !== normalizedWalletAddress
      );
      if (input) {
        counterpartyAddress = input.address;
      }
    }
    
    console.log(`[Blockfrost] Transaction ${hash} classified as ${type} for ${walletAddress}`);
    
    return {
      hash,
      blockHeight: txInfo.block_height,
      blockTime: txInfo.block_time,
      fees: txInfo.fees,
      type,
      amount,
      tokenSymbol,
      tokenAmount,
      counterpartyAddress,
      inputs: txUtxos.inputs,
      outputs: txUtxos.outputs,
    };
  } catch (error) {
    console.error(`Error fetching transaction details for ${hash}:`, error);
    throw error;
  }
}