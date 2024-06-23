// index.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const router = require('./router');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Use the router for handling routes
let pair = require('./router.js');
app.use('/code', pair);
app.get('/', (req, res) => {
    res.sendFile(path.join(__path, '/public/pair.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
