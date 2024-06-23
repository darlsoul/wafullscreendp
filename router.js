const express = require('express');
const cors = require('cors');
const { createSession } = require('./sessionManager');

const router = express.Router();

router.use(cors());
router.use(express.json());

router.get('/test', (req, res) => {
    res.send('Router is working!');
});

// Switch to POST if you intend to receive data in the body
router.get('/', async (req, res) => {
    const number = req.body.number;
    if (!number) {
        return res.status(400).send('No phone number provided.');
    }

    let id = 'temp';

    try {
        const { session, code } = await createSession(id, number);
        if (code && !res.headersSent) {
            return res.send({ code });
        }
        // Session is now accessible and message will be sent after connection
    } catch (error) {
        if (!res.headersSent) {
            res.status(503).send({ code: error.message });
        }
    }
});

module.exports = router;
