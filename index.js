const express = require('express');
const mssql = require('mssql');

(async () => {
  let pool;
  try {
    pool = await new mssql.ConnectionPool({
      user: process.env?.MSSQL_USERNAME ?? '',
      password: process.env?.MSSQL_PASSWORD ?? '',
      server: 'ramshackle-mssql',
      port: 1433,
      database: 'ramshackle',
      options: {
        trustServerCertificate: true,
        enableArithAbort: true,
      },
    });
  } catch (err) {
    console.log('ERROR: creating new pool SQL error', err.message, err);
    process.exit(1);
  }
  try {
    await pool.connect();
  } catch (err) {
    console.log('ERROR: connecting pool SQL error', err.message, err);
    pool.close();
    process.exit(1);
  }

  const app = express();

  app.get('/', (req, res) => {
    res.send('It Works!');
  });

  // http://localhost:8080/get-a-user-by-id?id=23
  // note: this project is meant as an example of sql injection (do not do this)
  app.get('/get-a-user-by-id', async (req, res) => {
    const { id } = req.query;
    console.log('get-a-user-by-id id: ', id);
    let results;
    try {
      const request = pool.request();
      const dbResult = await request.query(`SELECT * FROM [ramshackle].[dbo].[users] WHERE user_id = ${id}`);
      results = dbResult?.recordset ?? [];
    } catch (err) {
      console.log('get-user-by-id error', err.message, err);
      res.status(500).json({ errors: [err.message] });
      return;
    }
    res.status(200).json({ results });
  });

  app.listen(8080, () => {
    console.log('Example ramshackle app listening at http://localhost:8080');
  }).on('error', (err) => {
    console.log('express error: ', err.message, err);
  });
})();
