import express from 'express';
import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgres://postgres:12345@localhost:5432/postgres',
});

client.connect();

const app = express();

app.get('/search', async (req, res) => {
  const { firstName, lastName } = req.query;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'Missing firstName or lastName' });
  }

  const queryText = `SELECT * FROM users WHERE first_name LIKE $1 AND last_name LIKE $2`;

  const query = await client.query(queryText, [`%${firstName}%`, `%${lastName}%`]);

  res.json(query.rows);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


