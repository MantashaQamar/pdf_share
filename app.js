const express = require('express');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Set up SQLite database
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run("CREATE TABLE files (id INTEGER PRIMARY KEY, filename TEXT, path TEXT)");
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the index.html file at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to upload files
app.post('/upload', upload.single('pdf'), (req, res) => {
  const { originalname, filename } = req.file;
  const filePath = `/uploads/${filename}`;

  // Insert file metadata into the database
  db.run("INSERT INTO files (filename, path) VALUES (?, ?)", [originalname, filePath], function(err) {
    if (err) {
      return res.status(500).send("Database error");
    }
    res.send(`File uploaded successfully. Access it here: ${req.protocol}://${req.get('host')}${filePath}`);
  });
});

// Endpoint to list all files
app.get('/files', (req, res) => {
  db.all("SELECT * FROM files", [], (err, rows) => {
    if (err) {
      return res.status(500).send("Database error");
    }
    res.json(rows);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
