const express = require('express');
const cors = require('cors');

const router = express.Router();

router.use(cors());

router.get('/', async (req, res) => {
    res.send({ code:"670702" });
});

module.exports = router;
