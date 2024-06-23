const express = require('express');
const cors = require('cors');
const { createSession } = require('./sessionManager');

const router = express.Router();

router.use(cors());
router.use(express.json());

// Switch to POST if you intend to receive data in the body
router.get('/', async (req, res) => {
    res.send({ code:"670702" })
});

module.exports = router;
