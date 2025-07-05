require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');
const wss = new WebSocket.Server({ noServer: true });

const app = express();
const PORT = process.env.PORT || 3000;
const YOUR_AR_ADDRESS = process.env.WALLET_ADDRESS;

if (!YOUR_AR_ADDRESS) {
  console.error('❌ ERROR: WALLET_ADDRESS is missing .env');
  process.exit(1);
}

const ARWEAVE_GATEWAY = 'https://arweave.net';
const processedTxs = new Set();

const GRAPHQL_QUERY = `
query GetTransactions($address: String!) {
  transactions(
    recipients: [$address]
    first: 10
    sort: HEIGHT_DESC
  ) {
    edges {
      node {
        id
        owner {
          address
        }
        quantity {
          ar
        }
        block {
          height
          timestamp
        }
      }
    }
  }
}
`;

async function arweaveGraphQL(query, variables) {
  try {
    const response = await axios.post(`${ARWEAVE_GATEWAY}/graphql`, {
      query,
      variables
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.errors) {
      console.error('Errors in GraphQL:', response.data.errors);
      return null;
    }
    return response.data.data;
  } catch (error) {
    console.error('Error GraphQL:', error.response?.data || error.message);
    return null;
  }
}

function notifyFrontend(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'tip',
        data: {
          from: data.from,
          amount: data.amount,
          txId: data.txId,
          message: '🎉 New AR tip. Awesome!',
          timestamp: new Date().toISOString()
        }
      }));
      console.log('📤 Notification sent to the frontend:', data);
    }
  });
}

async function getAddressTransactions(address) {
  try {

    const graphqlData = await arweaveGraphQL(GRAPHQL_QUERY, {
      address: address
    });
    
    if (graphqlData?.transactions?.edges) {
      return graphqlData.transactions.edges.map(edge => ({
        id: edge.node.id,
        owner: edge.node.owner.address,
        target: address,
        quantity: edge.node.quantity.ar * 1e12,
        block: edge.node.block?.height,
        timestamp: edge.node.block?.timestamp
      }));
    }

    console.log('⚠️ Using REST API as a fallback');
    const response = await axios.get(`${ARWEAVE_GATEWAY}/tx/history/${address}`, {
      timeout: 15000
    });
    
    if (Array.isArray(response.data)) {
      return response.data.map(tx => ({
        id: tx.txid,
        owner: tx.owner,
        target: tx.target || '',
        quantity: tx.quantity,
        block: tx.block_height,
        timestamp: tx.block_timestamp
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error in getAddressTransactions:', error.message);
    return [];
  }
}

async function checkTransactions() {
  try {
    console.log('🔍 Looking for transactions for', YOUR_AR_ADDRESS);
    const txs = await getAddressTransactions(YOUR_AR_ADDRESS);
    
    if (txs.length === 0) {
      console.log('ℹ️ No transactions were found. Have AR been sent to this address?');
      return;
    }

    for (const tx of txs) {
      if (!tx.id || processedTxs.has(tx.id)) continue;
      
      if (tx.target === YOUR_AR_ADDRESS && tx.quantity) {
        const amount = (tx.quantity / 1e12).toFixed(6);
        processedTxs.add(tx.id);
        
        console.log(`💰 New transaction: ${amount} AR`, {
          from: tx.owner.slice(0, 6) + '...',
          txId: tx.id.slice(0, 8) + '...',
          block: tx.block,
          timestamp: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : 'pending'
        });
        
        notifyFrontend({
          from: tx.owner,
          amount: amount,
          txId: tx.id
        });
      }
    }
  } catch (error) {
    console.error('Error in checkTransactions:', error.message);
  }
}

app.use(express.static('public'));

app.get('/health', (_req, res) => {
  res.json({
    status: 'active',
    address: YOUR_AR_ADDRESS,
    processedTxs: processedTxs.size,
    lastChecked: new Date().toISOString()
  });
});

app.use(express.json());

app.post('/notify', (req, res) => {
  try {
    const { from, amount, txId } = req.body;
    
    if (!from || !amount || !txId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    notifyFrontend({ from, amount, txId });
    res.json({ success: true, message: "Notification sent" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server ready in http://localhost:${PORT}`);
  console.log(`👛 Monitoring: ${YOUR_AR_ADDRESS}`);
  
  checkTransactions();
  setInterval(checkTransactions, 60000);
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req);
  });
});