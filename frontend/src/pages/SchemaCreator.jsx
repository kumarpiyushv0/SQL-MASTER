import React, { useState } from 'react';


const SchemaCreator = () => {
  const [schemaName, setSchemaName] = useState('');
  const [tables, setTables] = useState([createEmptyTable()]);
  const userId = 124755; // Replace with dynamic user ID if needed

  function createEmptyTable() {
    return {
      tableName: '',
      columns: [
        { name: '', type: 'VARCHAR(255)', isPrimaryKey: false, isNotNull: false },
      ],
      rows: [],
    };
  }

  const handleAddTable = () => {
    setTables([...tables, createEmptyTable()]);
  };

  const handleRemoveTable = (index) => {
    const updatedTables = tables.filter((_, i) => i !== index);
    setTables(updatedTables);
  };

  const handleTableChange = (index, key, value) => {
    const updatedTables = [...tables];
    updatedTables[index][key] = value;
    setTables(updatedTables);
  };

  const handleColumnChange = (tableIndex, columnIndex, key, value) => {
    const updatedTables = [...tables];
    updatedTables[tableIndex].columns[columnIndex][key] = value;
    setTables(updatedTables);
  };

  const handleAddColumn = (tableIndex) => {
    const updatedTables = [...tables];
    updatedTables[tableIndex].columns.push({
      name: '',
      type: 'VARCHAR(255)',
      isPrimaryKey: false,
      isNotNull: false,
    });
    setTables(updatedTables);
  };

  const handleRemoveColumn = (tableIndex, columnIndex) => {
    const updatedTables = [...tables];
    updatedTables[tableIndex].columns = updatedTables[tableIndex].columns.filter(
      (_, i) => i !== columnIndex
    );
    setTables(updatedTables);
  };

  const handleRowChange = (tableIndex, rowIndex, columnName, value) => {
    const updatedTables = [...tables];
    updatedTables[tableIndex].rows[rowIndex][columnName] = value;
    setTables(updatedTables);
  };

  const handleRemoveRow = (tableIndex, rowIndex) => {
    const updatedTables = [...tables];
    updatedTables[tableIndex].rows = updatedTables[tableIndex].rows.filter((_, i) => i !== rowIndex);
    setTables(updatedTables);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedTables = tables.map((table) => ({
      name: table.tableName,
      columns: table.columns.map((col) => ({
        name: col.name,
        type: col.type,
        options: `${col.isPrimaryKey ? 'PRIMARY KEY' : ''}${col.isPrimaryKey && col.isNotNull ? ' ' : ''}${col.isNotNull ? 'NOT NULL' : ''}`.trim(),
      })),
      rows: table.rows,
    }));

    const schemaData = {
      userId,
      schemaName,
      tables: formattedTables,
    };

    try {
      const response = await fetch('http://localhost:3000/api/schemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schemaData),
      });

      if (!response.ok) {
        throw new Error('Failed to create schema');
      }

      const result = await response.json();
      alert('Schema successfully created!');
      console.log(result);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while creating the schema.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Schema</h2>
      <label>Schema Name:</label>
      <input
        type="text"
        value={schemaName}
        onChange={(e) => setSchemaName(e.target.value)}
        required
      />

      {tables.map((table, tableIndex) => (
        <fieldset key={tableIndex} className="section">
          <legend>Table {tableIndex + 1}</legend>

          <label>Table Name:</label>
          <input
            type="text"
            value={table.tableName}
            onChange={(e) => handleTableChange(tableIndex, 'tableName', e.target.value)}
            required
          />

          {table.columns.map((column, colIndex) => (
            <div className="column-group" key={colIndex}>
              <label>Column Name:</label>
              <input
                type="text"
                value={column.name}
                onChange={(e) => handleColumnChange(tableIndex, colIndex, 'name', e.target.value)}
                required
              />

              <label>Data Type:</label>
              <select
                value={column.type}
                onChange={(e) => handleColumnChange(tableIndex, colIndex, 'type', e.target.value)}
              >
                <option value="VARCHAR(255)">VARCHAR(255)</option>
                <option value="INT">INT</option>
                <option value="TEXT">TEXT</option>
                <option value="DATE">DATE</option>
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="DECIMAL(10,2)">DECIMAL(10,2)</option>
              </select>

              <div className="column-options">
                <label>
                  <input
                    type="checkbox"
                    checked={column.isPrimaryKey}
                    onChange={(e) =>
                      handleColumnChange(tableIndex, colIndex, 'isPrimaryKey', e.target.checked)
                    }
                  />{' '}
                  Primary Key
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={column.isNotNull}
                    onChange={(e) =>
                      handleColumnChange(tableIndex, colIndex, 'isNotNull', e.target.checked)
                    }
                  />{' '}
                  Not Null
                </label>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleRemoveColumn(tableIndex, colIndex)}
                >
                  Remove Column
                </button>
              </div>
            </div>
          ))}

          <button type="button" onClick={() => handleAddColumn(tableIndex)}>
            Add Column
          </button>

          <button
            type="button"
            className="remove-btn"
            onClick={() => handleRemoveTable(tableIndex)}
          >
            Remove Table
          </button>
        </fieldset>
      ))}

      <button type="button" onClick={handleAddTable}>
        Add Table
      </button>
      <button type="submit">Create Schema</button>
    </form>
  );
};

export default SchemaCreator;
