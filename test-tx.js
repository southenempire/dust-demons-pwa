const { Connection, PublicKey } = require('@solana/web3.js');
async function run() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const sigs = await conn.getSignaturesForAddress(new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), {limit: 1});
  const tx = await conn.getTransaction(sigs[0].signature, { maxSupportedTransactionVersion: 0 });
  console.log(tx.transaction.message.accountKeys ? "Has accountKeys" : "No accountKeys");
  console.log(tx.transaction.message.staticAccountKeys ? "Has staticAccountKeys" : "No staticAccountKeys");
}
run().catch(console.error);
