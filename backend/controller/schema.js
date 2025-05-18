const pool = require('../db');

exports.createSchema = async (req, res) => {
  const userId = req.body.userId;  // Normally from token
  const { schemaName, tables } = req.body;

  if (!schemaName || !tables) {
    return res.status(400).json({ error: 'Schema name and tables are required' });
  }

  const schemaId = `user_${userId}_${schemaName}`.replace(/[^a-zA-Z0-9_]/g, '');

  try {
    const conn = await pool.getConnection();

    await conn.query(`CREATE SCHEMA IF NOT EXISTS \`${schemaId}\`;`);

    for (const table of tables) {
      const tableName = table.name.replace(/[^a-zA-Z0-9_]/g, '');
      const columns = table.columns.map(col => {
        const colName = col.name.replace(/[^a-zA-Z0-9_]/g, '');
        const type = col.type.toUpperCase();
        const options = col.options || '';
        return `\`${colName}\` ${type} ${options}`.trim();
      }).join(', ');

      const createSQL = `CREATE TABLE IF NOT EXISTS \`${schemaId}\`.\`${tableName}\` (${columns});`;
      await conn.query(createSQL);
    }

    conn.release();
    res.status(201).json({
      message: `Schema '${schemaId}' and ${tables.length} table(s) created successfully.`,
      schemaId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error during schema creation.' });
  }
};

exports.getSchema = async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'user\\_%'
    `);

    conn.release();

    const schemaNames = rows.map(row => row['SCHEMA_NAME']);

    res.status(200).json({ schemas: schemaNames });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve schemas' });
  }
};
