// Local development server — imports the shared Express app and starts listening.
// For Vercel deployment, see backend/api/index.js
require('dotenv').config();
const app = require('./app');

const net = require('net');
const PORT = process.env.PORT || 5000;

function checkPortFree(port, host = '0.0.0.0') {
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once('error', () => { tester.close(); resolve(false); })
            .once('listening', () => { tester.close(); resolve(true); })
            .listen(port, host);
    });
}

async function startServer(retries = 10, delayMs = 500) {
    for (let i = 0; i <= retries; i++) {
        const free = await checkPortFree(PORT, '0.0.0.0');
        if (free) {
            const server = app.listen(PORT, '0.0.0.0', () => {
                console.log(`✅ Server is running on http://localhost:${PORT}`);
            });
            server.on('error', (err) => {
                console.error('Server error:', err);
                process.exit(1);
            });
            return;
        }
        console.warn(`Port ${PORT} is in use. Retry ${i + 1}/${retries} in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
    }
    console.error(`❌ Failed to bind to port ${PORT} after ${retries} retries.`);
    process.exit(1);
}

startServer();