const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require("body-parser");

const app = express();
const __path = process.cwd();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__path, 'public')));

let pair = require('./router.js');
app.use('/code', pair);

app.get('/', (req, res) => {
    res.sendFile(path.join(__path, '/index.html'));
});

app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
});
