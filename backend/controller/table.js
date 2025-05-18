const pool = require("../db");

//List All Tables
exports.listTables = async (req, res) => {
  const schemaId = req.params.schemaId;
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`SHOW TABLES FROM \`${schemaId}\`;`);
    conn.release();

    const tables = rows.map((row) => Object.values(row)[0]);
    res.status(200).json({ tables });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list tables." });
  }
};

//List all columns in a table
exports.getTableColumns = async (req, res) => {
  const schemaId = req.params.schemaId;
  const tableName = req.params.tableName;

  try {
    const conn = await pool.getConnection();
    const [columns] = await conn.query(
      `SHOW COLUMNS FROM \`${schemaId}\`.\`${tableName}\`;`
    );
    conn.release();

    const columnData = columns.map((col) => ({
      name: col.Field,
      type: col.Type,
      nullable: col.Null === "YES",
      isPrimaryKey: col.Key === "PRI",
    }));

    res.status(200).json({ columns: columnData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get table structure." });
  }
};

//List data of each table
exports.getTableRows = async (req, res) => {
  const schemaId = req.params.schemaId;
  const tableName = req.params.tableName;

  const limit = parseInt(req.query.limit) || 100;

  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query(
      `SELECT * FROM \`${schemaId}\`.\`${tableName}\` LIMIT ?`,
      [limit]
    );

    conn.release();

    res.status(200).json({ rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch rows from table.",
      details: err.message,
    });
  }
};


//Insert data in each table
exports.insertRow = async (req, res) => {
  const schemaId = req.params.schemaId;
  const tableName = req.params.tableName;
  const data = req.body.data;

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Invalid or missing data object." });
  }

  try {
    const conn = await pool.getConnection();

    // 1. Fetch table columns
    const [columns] = await conn.query(
      `SHOW COLUMNS FROM \`${schemaId}\`.\`${tableName}\`;`
    );
    const validColumnNames = columns.map((col) => col.Field);

    // 2. Filter valid fields
    const filteredData = {};
    for (const key in data) {
      if (validColumnNames.includes(key)) {
        filteredData[key] = data[key];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      conn.release();
      return res
        .status(400)
        .json({ error: "No valid columns provided for this table." });
    }

    const columnsStr = Object.keys(filteredData)
      .map((col) => `\`${col}\``)
      .join(", ");
    const values = Object.values(filteredData);
    const placeholders = values.map(() => "?").join(", ");

    // 3. Insert the row
    const sql = `INSERT INTO \`${schemaId}\`.\`${tableName}\` (${columnsStr}) VALUES (${placeholders})`;
    const [result] = await conn.query(sql, values);

    // 4. Fetch and return inserted row if possible
    let insertedRow = null;
    const hasIdColumn = validColumnNames.includes("id") && result.insertId;
    if (hasIdColumn) {
      const [rows] = await conn.query(
        `SELECT * FROM \`${schemaId}\`.\`${tableName}\` WHERE id = ?`,
        [result.insertId]
      );
      insertedRow = rows[0] || null;
    }

    conn.release();
    res.status(201).json({
      message: "Row inserted successfully.",
      inserted: insertedRow,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to insert row into table.",
      details: err.message,
    });
  }
};


//Update each table data
exports.updateRow = async (req, res) => {
  const { schemaId, tableName, rowId } = req.params;
  const data = req.body.data;

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Invalid or missing data object." });
  }

  try {
    const conn = await pool.getConnection();
    const [columns] = await conn.query(
      `SHOW COLUMNS FROM \`${schemaId}\`.\`${tableName}\`;`
    );

    const validColumnNames = columns.map((col) => col.Field);
    const pkColumns = columns
      .filter((col) => col.Key === "PRI")
      .map((col) => col.Field);

    if (!pkColumns.length) {
      conn.release();
      return res
        .status(400)
        .json({ error: "No primary key defined for this table." });
    }

    // Extract primary key values from the composite rowId
    const rowIdParts = rowId.split("_");
    if (rowIdParts.length !== pkColumns.length) {
      conn.release();
      return res
        .status(400)
        .json({ error: "Primary key mismatch for update." });
    }

    const filteredData = {};
    for (const key in data) {
      if (validColumnNames.includes(key)) {
        filteredData[key] = data[key];
      }
    }

    if (!Object.keys(filteredData).length) {
      conn.release();
      return res
        .status(400)
        .json({ error: "No valid columns provided for update." });
    }

    const setClause = Object.keys(filteredData)
      .map((col) => `\`${col}\` = ?`)
      .join(", ");
    const whereClause = pkColumns.map((col) => `\`${col}\` = ?`).join(" AND ");
    const values = [...Object.values(filteredData), ...rowIdParts];

    const sql = `UPDATE \`${schemaId}\`.\`${tableName}\` SET ${setClause} WHERE ${whereClause}`;
    const [result] = await conn.query(sql, values);

    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Row not found to update." });
    }

    res.status(200).json({ message: "Row updated successfully." });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to update row.", details: err.message });
  }
};


//Deletes table data
exports.deleteRow = async (req, res) => {
  const { schemaId, tableName, rowId } = req.params;

  try {
    const conn = await pool.getConnection();
    const [columns] = await conn.query(
      `SHOW COLUMNS FROM \`${schemaId}\`.\`${tableName}\`;`
    );
    const pkColumns = columns
      .filter((col) => col.Key === "PRI")
      .map((col) => col.Field);

    if (!pkColumns.length) {
      conn.release();
      return res
        .status(400)
        .json({ error: "No primary key defined for this table." });
    }

    const rowIdParts = rowId.split("_");
    if (rowIdParts.length !== pkColumns.length) {
      conn.release();
      return res
        .status(400)
        .json({ error: "Primary key mismatch for delete." });
    }

    const whereClause = pkColumns.map((col) => `\`${col}\` = ?`).join(" AND ");
    const sql = `DELETE FROM \`${schemaId}\`.\`${tableName}\` WHERE ${whereClause}`;
    const [result] = await conn.query(sql, rowIdParts);

    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Row not found to delete." });
    }

    res.status(200).json({ message: "Row deleted successfully." });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to delete row.", details: err.message });
  }
};
