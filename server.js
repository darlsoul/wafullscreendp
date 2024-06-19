const express = require('express');
const router = require('./router'); // Assume router.js is in the same directory

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use('/upload', router);

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
