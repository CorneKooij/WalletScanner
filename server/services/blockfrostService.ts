import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const apiKey = process.env.BLOCKFROST_API_KEY;
if (!apiKey) {
  throw new Error('BLOCKFROST_API_KEY environment variable is not set');
}

const blockfrost = new BlockFrostAPI({
  projectId: apiKey,
  network: 'mainnet',
});

// ADA Handle Policy ID - required for resolving handles
const ADA_HANDLE_POLICY_ID = 'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a';

const logApiCall = (method: string, ...args: any[]) => {
  console.log(`[Blockfrost API] Calling ${method} with args:`, ...args);
};

export async function getWalletInfo(address: string, isHandle = false) {
  try {
    logApiCall('getWalletInfo', address, isHandle);

    let resolvedAddress = address;

    // If it's a handle, resolve it to an address
    if (isHandle) {
      try {
        console.log('[Blockfrost] Resolving handle:', address);
        // Convert handle to hex and append to policy ID
        const handleHex = Buffer.from(address).toString('hex');
        const assetId = `${ADA_HANDLE_POLICY_ID}${handleHex}`;
        console.log('[Blockfrost] Looking up asset:', assetId);

        // Get handle asset info
        const handleInfo = await blockfrost.assetsById(assetId);
        if (!handleInfo) {
          throw new Error('Handle not found');
        }

        // Get transactions for this handle
        const txs = await blockfrost.assetsTransactions(assetId);
        if (!txs || txs.length === 0) {
          throw new Error('No transactions found for handle');
        }

        // Get the first transaction output (handle owner)
        const tx = await blockfrost.txsUtxos(txs[0].tx_hash);
        if (!tx || !tx.outputs || tx.outputs.length === 0) {
          throw new Error('No outputs found in handle transaction');
        }

        resolvedAddress = tx.outputs[0].address;
        console.log('[Blockfrost] Resolved handle to address:', resolvedAddress);
      } catch (error) {
        console.error('[Blockfrost] Error resolving handle:', error);
        throw new Error('Handle not found or invalid');
      }
    }

    // Get address details
    const addressInfo = await blockfrost.addresses(resolvedAddress);
    console.log('[Blockfrost] Address info:', addressInfo);

    // Get transaction history
    const transactions = await blockfrost.addressesTransactions(resolvedAddress, {
      count: 20,
      order: 'desc'
    });
    console.log('[Blockfrost] Found transactions:', transactions.length);

    // Get asset balances using UTXO information
    const utxos = await blockfrost.addressesUtxos(resolvedAddress);
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
    for (const [unit, quantity] of tokenMap.entries()) {
      if (unit === 'lovelace') {
        tokens.push({
          unit,
          quantity,
          name: 'Cardano',
          symbol: 'ADA',
          decimals: 6
        });
        continue;
      }

      try {
        const metadata = await blockfrost.assetsById(unit);
        console.log(`[Blockfrost] Metadata for ${unit}:`, metadata);

        const policyId = unit.slice(0, 56);
        const assetNameHex = unit.slice(56);

        let assetName;
        try {
          assetName = assetNameHex ? Buffer.from(assetNameHex, 'hex').toString() : undefined;
        } catch (e) {
          console.log(`[Blockfrost] Could not decode asset name for ${unit}:`, e);
          assetName = assetNameHex;
        }

        tokens.push({
          unit,
          quantity,
          name: metadata.metadata?.name || assetName || metadata.asset_name || unit.slice(0, 10) + '...',
          symbol: metadata.metadata?.ticker || metadata.asset || (assetName ? assetName.slice(0, 5) : unit.slice(0, 5)),
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

    // Format the response
    return {
      address: resolvedAddress,
      handle: isHandle ? address : null,
      tokens,
      transactions: transactions.map(tx => ({
        hash: tx.tx_hash,
        blockHeight: tx.block_height,
        blockTime: tx.block_time,
      })),
    };
  } catch (error: any) {
    console.error('[Blockfrost] Error in getWalletInfo:', error);
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
      decimals: 0, 
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
    let type = 'transfer'; 
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
        amount = '0'; 
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