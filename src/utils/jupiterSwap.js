// src/utils/jupiterSwap.js
import { VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

// Fix for browser compatibility
window.Buffer = window.Buffer || Buffer;

const JUP_MINT = "JUPyiwrYJFskUPiHa7hkeR8VUtkPeWkRBCNk6b4204p";
const SOL_MINT = "So11111111111111111111111111111111111111112";

export const triggerUnlockSwap = async (wallet, connection) => {
  if (!wallet.publicKey) return false;

  try {
    // 1. Get Quote (approx $10 USD worth of SOL to JUP)
    // Adjust 'amount' (in lamports) if needed. 50000000 is ~0.05 SOL.
    const quote = await (
      await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT}&outputMint=${JUP_MINT}&amount=50000000&slippageBps=50`)
    ).json();

    // 2. Get the Transaction data from Jupiter
    const { swapTransaction } = await (
      await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
        })
      })
    ).json();

    // 3. Sign and Send
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    
    const signature = await wallet.sendTransaction(transaction, connection);
    
    // 4. Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    console.log("Swap Success:", signature);
    return true;

  } catch (error) {
    console.error("Swap Failed:", error);
    alert("Swap Failed! Check console for details.");
    return false;
  }
};