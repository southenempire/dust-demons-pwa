const walletAddress = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"; // random wallet
const burnTxSignature = "4wPzJzWgW1nKjN2fE5Z6Gg7oBxHkqDkFq4wPzJzWgW1nKjN2fE5Z6Gg7oBxHkqDkFq4wPzJzWgW1nKjN2fE5"; // random sig
fetch('http://localhost:3000/api/og-burner/claim', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress, burnTxSignature })
}).then(r => r.json()).then(console.log).catch(console.error);
