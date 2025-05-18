const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const schemaRoutes = require('./routes/schema');
const tableRoutes = require('./routes/table');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('views'));

app.use('/api', schemaRoutes);
app.use('/api', tableRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
