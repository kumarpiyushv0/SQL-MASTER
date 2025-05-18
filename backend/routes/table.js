const express = require('express');
const router = express.Router();
const {
  insertRow,
  listTables,
  getTableColumns,
  getTableRows,
  updateRow,
  deleteRow
} = require('../controller/table');

router.get('/schemas/:schemaId/tables', listTables);
router.post('/schemas/:schemaId/tables/:tableName/rows', insertRow);
router.get('/schemas/:schemaId/tables/:tableName/columns', getTableColumns);
router.get('/schemas/:schemaId/tables/:tableName/rows', getTableRows);
router.put('/schemas/:schemaId/tables/:tableName/rows/:rowId', updateRow);
router.delete('/schemas/:schemaId/tables/:tableName/rows/:rowId', deleteRow);


module.exports = router;
