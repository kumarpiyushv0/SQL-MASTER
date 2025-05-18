const express = require('express');
const router = express.Router();
const { createSchema, getSchema } = require('../controller/schema');

router.post('/schemas', createSchema);
router.get('/schemas', getSchema);
module.exports = router;
