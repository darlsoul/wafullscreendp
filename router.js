const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.send({ code:"670702" });
});

module.exports = router;
