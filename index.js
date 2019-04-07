const express = require('express')
const cool = require('cool-ascii-faces')
const path = require('path')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/cool', (req, res) => res.send(cool()))
  /*.get('/db', async (req, res) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM login');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })*/
  .post('/db', async (req, res) => {
  	var email = req.param('email');
    var pass = req.param('pass');
    try {
      const client = await pool.connect();
      const result = await client.query(`SELECT * FROM login where ${ email} = email AND ${pass} = pass`);
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Er " + err ;
    }
  })

  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
