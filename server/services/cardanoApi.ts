import { shortenAddress } from "../../client/src/lib/formatUtils";

// Sample wallet data for development
const SAMPLE_WALLET_DATA = {
  address: "addr1q9u5n39xmgzwzfsxnkgqt3fragk32k4uv4qcwmza0hq2luyr2wfvwkxmp4j2mztw6jm2tmxwdrgxj3pwmcx4au4k5mqhtez9t",
  handle: null,
  tokens: [
    {
      name: "Cardano",
      symbol: "ADA",
      balance: 248532.21,
      valueUsd: 124266.10
    },
    {
      name: "HOSKY Token",
      symbol: "HOSKY",
      balance: 1250000,
      valueUsd: 18750.00
    },
    {
      name: "DJED Stablecoin",
      symbol: "DJED",
      balance: 8500,
      valueUsd: 8500.00
    },
    {
      name: "Sundae",
      symbol: "SUNDAE",
      balance: 3200,
      valueUsd: 1280.00
    },
    {
      name: "MIN Token",
      symbol: "MIN",
      balance: 542,
      valueUsd: 325.20
    }
  ],
  transactions: [
    {
      type: "received",
      amount: 120.00,
      timestamp: Date.now() / 1000 - 3600, // 1 hour ago
      address: "addr1qx...9ugh2",
      fullAddress: "addr1qxhc0uw9jdmtehvx2uttc4k60qaeqe75uqcz5qmmuu0vr9x7s5qmv3y9cwuslfu42ykxsnv3q6q607ksmjxx2j7hlm9sjrgjs9",
      explorerUrl: "https://cardanoscan.io/transaction/1234567890"
    },
    {
      type: "sent",
      amount: 42.50,
      timestamp: Date.now() / 1000 - 86400, // 1 day ago
      address: "addr1qx...9ugh2",
      fullAddress: "addr1qxhc0uw9jdmtehvx2uttc4k60qaeqe75uqcz5qmmuu0vr9x7s5qmv3y9cwuslfu42ykxsnv3q6q607ksmjxx2j7hlm9sjrgjs9",
      explorerUrl: "https://cardanoscan.io/transaction/0987654321"
    },
    {
      type: "swap",
      amount: 85.00,
      tokenSymbol: "HOSKY",
      tokenAmount: 100,
      timestamp: Date.now() / 1000 - 172800, // 2 days ago
      address: "Contract",
      fullAddress: "Contract",
      explorerUrl: "https://cardanoscan.io/transaction/1122334455"
    },
    {
      type: "stake_reward",
      amount: 3.21,
      timestamp: Date.now() / 1000 - 259200, // 3 days ago
      address: "Stake Pool",
      fullAddress: "Stake Pool",
      explorerUrl: "https://cardanoscan.io/transaction/5566778899"
    },
    {
      type: "received",
      amount: 200.00,
      timestamp: Date.now() / 1000 - 345600, // 4 days ago
      address: "addr1qz...7gh5",
      fullAddress: "addr1qz7gh5prh2wfg3xzxs7080qg4yn6jvwzn3xz9nq7ets2guyr2wfvwkxmp4j2mztw6jm2tmxwdrgxj3pwmcx4au4k5mqvn8nsf",
      explorerUrl: "https://cardanoscan.io/transaction/99887766554"
    },
    {
      type: "sent",
      amount: 10.50,
      timestamp: Date.now() / 1000 - 432000, // 5 days ago
      address: "addr1q8...k9f3",
      fullAddress: "addr1q8k9f3prh2wfg3xzxs7080qg4yn6jvwzn3xz9nq7ets2guyr2wfvwkxmp4j2mztw6jm2tmxwdrgxj3pwmcx4au4k5mqr8mvn7",
      explorerUrl: "https://cardanoscan.io/transaction/33221144556"
    },
    {
      type: "swap",
      amount: 120.00,
      tokenSymbol: "DJED",
      tokenAmount: 118,
      timestamp: Date.now() / 1000 - 518400, // 6 days ago
      address: "Contract",
      fullAddress: "Contract",
      explorerUrl: "https://cardanoscan.io/transaction/99887744556"
    }
  ],
  nfts: [
    {
      name: "Cardano Summit 2021",
      collection: "Summit Collection",
      image: "https://ipfs.io/ipfs/QmNvdQjjrEHpkS7xRB9CMPNHq9GQi2K9JCGNqvzZrAcxRs",
      policyId: "d5e6bf0500378d4f0da4e8dde6becec7621cd8cbf5cbb9b87013d4cc",
      attributes: [
        { trait: "Event", value: "Summit 2021" },
        { trait: "Type", value: "Attendance" }
      ]
    },
    {
      name: "SpaceBud #1337",
      collection: "SpaceBuds",
      image: "https://ipfs.io/ipfs/QmNgfrDiLdwb5y8TXWtiA3AUzn9w85cfEKcA86pCKggBJp",
      policyId: "a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235",
      attributes: [
        { trait: "Species", value: "Monkey" },
        { trait: "Suit", value: "Blue" },
        { trait: "Accessory", value: "Helmet" }
      ]
    },
    {
      name: "ClayNation #4242",
      collection: "ClayNation",
      image: "https://ipfs.io/ipfs/QmY5R4kYA9myGD5QxKvDbxCQwbzjNu7QiCGbcUNBJJunLx",
      policyId: "40fa2aa67258b4ce7b5782f74831d46a84c59a0ff0c28262fab21728",
      attributes: [
        { trait: "Background", value: "Blue" },
        { trait: "Face", value: "Happy" },
        { trait: "Hat", value: "Cowboy" }
      ]
    }
  ],
  balanceHistory: [
    { date: "2024-02-10", balance: 243210 },
    { date: "2024-02-11", balance: 244800 },
    { date: "2024-02-12", balance: 245200 },
    { date: "2024-02-13", balance: 246100 },
    { date: "2024-02-14", balance: 247500 },
    { date: "2024-02-15", balance: 247100 },
    { date: "2024-02-16", balance: 248532 }
  ]
};

/**
 * Fetches wallet data from the Cardano blockchain
 * In a real-world implementation, this would connect to Cardano API services like Blockfrost
 * For this demo, we're returning sample data
 * 
 * @param address Wallet address or handle
 * @returns Wallet data or null if not found
 */
export async function fetchWalletData(address: string): Promise<any> {
  // In a real implementation, you'd make API calls to Blockfrost or similar services
  // For example:
  // const response = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`, {
  //   headers: { 'project_id': process.env.BLOCKFROST_API_KEY || '' }
  // });
  
  try {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For development purposes, return sample data
    // In a real implementation, validate the address and fetch actual data
    
    // Return modified sample data with the provided address
    return {
      ...SAMPLE_WALLET_DATA,
      address,
      transactions: SAMPLE_WALLET_DATA.transactions.map(tx => ({
        ...tx,
        address: tx.address === "Contract" || tx.address === "Stake Pool" 
          ? tx.address 
          : shortenAddress(tx.fullAddress || "")
      }))
    };
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return null;
  }
}
