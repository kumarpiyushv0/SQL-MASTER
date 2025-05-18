// SchemaViewer.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "http://localhost:3000/api";

const SchemaViewer = () => {
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [formData, setFormData] = useState({});
  const [editRowKey, setEditRowKey] = useState(null);
  const [primaryKeyCols, setPrimaryKeyCols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSchemas();
  }, []);

  const showMessage = (msg, type) => {
    if (type === "error") {
      setError(msg);
      setTimeout(() => setError(""), 3000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const fetchSchemas = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/schemas`);
      setSchemas(data.schemas || []);
    } catch {
      showMessage("Failed to fetch schemas", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async (schemaName) => {
    try {
      setLoading(true);
      setSelectedSchema(schemaName);
      const { data } = await axios.get(`${baseUrl}/schemas/${schemaName}/tables`);
      setTables(data.tables || []);
    } catch {
      showMessage("Failed to fetch tables", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRows = async (schemaName, tableName) => {
    try {
      setLoading(true);
      setSelectedTable(tableName);
      const res = await axios.get(`${baseUrl}/schemas/${schemaName}/tables/${tableName}/rows`);
      const colRes = await axios.get(`${baseUrl}/schemas/${schemaName}/tables/${tableName}/columns`);
      setRows(res.data.rows || []);
      setColumns(colRes.data.columns || []);
      const pks = (colRes.data.columns || []).filter(c => c.isPrimaryKey).map(c => c.name);
      setPrimaryKeyCols(pks);
      setFormData({});
      setEditRowKey(null);
    } catch {
      showMessage("Failed to fetch rows or columns", "error");
    } finally {
      setLoading(false);
    }
  };

  const getRowKey = (rowOrData) => {
    if (!primaryKeyCols.length) return "";
    return primaryKeyCols.map(col => rowOrData[col]).join("_");
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const key = getRowKey(formData);
    const url = editRowKey
      ? `${baseUrl}/schemas/${selectedSchema}/tables/${selectedTable}/rows/${key}`
      : `${baseUrl}/schemas/${selectedSchema}/tables/${selectedTable}/rows`;
    const method = editRowKey ? "put" : "post";

    try {
      await axios[method](url, { data: formData });
      showMessage(editRowKey ? "Row updated" : "Row inserted", "success");
      fetchRows(selectedSchema, selectedTable);
    } catch {
      showMessage("Failed to save row", "error");
    }
  };

  const handleEdit = (row) => {
    setFormData(row);
    setEditRowKey(getRowKey(row));
  };

  const handleDelete = async (row) => {
    const key = getRowKey(row);
    try {
      await axios.delete(`${baseUrl}/schemas/${selectedSchema}/tables/${selectedTable}/rows/${key}`);
      showMessage("Row deleted", "success");
      fetchRows(selectedSchema, selectedTable);
    } catch {
      showMessage("Failed to delete row", "error");
    }
  };

return (
  <div className="schema-viewer-container">
    <h2 className="heading">Schema Viewer</h2>

    {loading && <p className="loading-text">Loading...</p>}
    {error && <p className="error-text">{error}</p>}
    {success && <p className="success-text">{success}</p>}

    {!selectedSchema ? (
      <div>
        <h3 className="subheading">Schemas</h3>
        {schemas.map((name) => (
          <button
            key={name}
            className="schema-button"
            onClick={() => fetchTables(name)}
          >
            {name}
          </button>
        ))}
      </div>
    ) : !selectedTable ? (
      <div>
        <h3 className="subheading">Tables in {selectedSchema}</h3>
        <button onClick={() => setSelectedSchema(null)} className="back-button">← Back to Schemas</button>
        <div>
          {tables.map((name) => (
            <button
              key={name}
              className="table-button"
              onClick={() => fetchRows(selectedSchema, name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    ) : (
      <div>
        <h3 className="subheading">Rows in {selectedTable}</h3>
        <button onClick={() => setSelectedTable(null)} className="back-button">← Back to Tables</button>

        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className={`table-header ${primaryKeyCols.includes(col.name) ? "pk-column" : ""}`}
                >
                  {col.name}
                </th>
              ))}
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((col) => (
                  <td key={col.name} className="table-cell">{row[col.name]}</td>
                ))}
                <td>
                  <button onClick={() => handleEdit(row)} className="edit-button">Edit</button>
                </td>
                <td>
                  <button onClick={() => handleDelete(row)} className="delete-button">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={handleSubmit} className="form-container">
          <h4 className="form-heading">{editRowKey ? "Edit Row" : "Insert New Row"}</h4>
          {columns.map((col) => (
            <div key={col.name} className="form-group">
              <label className="form-label">
                {col.name} {primaryKeyCols.includes(col.name) && "(PK)"}
              </label>
              <input
                name={col.name}
                value={formData[col.name] || ""}
                onChange={handleInputChange}
                className="form-input"
                placeholder={col.type}
                disabled={editRowKey && primaryKeyCols.includes(col.name)}
              />
            </div>
          ))}
          <button type="submit" className="submit-button">
            {editRowKey ? "Update Row" : "Add Row"}
          </button>
        </form>
      </div>
    )}
  </div>
);

};

export default SchemaViewer;
