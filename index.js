const express = require('express')
const cool = require('cool-ascii-faces')
const path = require('path')
var bodyParser = require('body-parser')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(bodyParser.urlencoded({extended:false}))
  .use(bodyParser.json())
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/cool', (req, res) => res.send(cool()))

  //POST PARA LOGIN
  .get('/db', async (req, res) => {
    try {
   	  const email = req.param("email");
   	  let pass = req.param("pass");
   	  const query = `SELECT login.email, personal.nivel, personal.id FROM login, personal where '${email}' = login.email and '${pass}' = login.pass and login.id = personal.log_id `;
   	  console.log(query);
      const client = await pool.connect()
      const result = await client.query(query);
      const results = { 'results': (result) ? result.rows : null};
      res.json( results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  }) 
  //POST PARA VER INFORMACION PERSONAL  TUTOR post tipo email
  .get('/personal', async (req, res) => {
    try {
      const email = req.param("email");
      const query = `SELECT personal.nombre, personal.apellido_materno, personal.apellido_paterno, personal.rut, login.email, personal.nivel, personal.fecha_ingreso
                       FROM login, personal where '${email}' = login.email and login.id = personal.log_id `;
      console.log(query);
      const client = await pool.connect()
      const result = await client.query(query);
      const results = { 'results': (result) ? result.rows : null};
      res.json(results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  }) 
  //POST DE PUNTAJE CONDUCTOR post tipo rut
  .get('/puntaje', async (req, res) => {
    try {
      const rut = req.param("rut");
      const query = `SELECT conductor.nombre, conductor.estado, puntos.modo_libre, puntos.modo_sen, puntos.modo_esta, puntos.modo_peaton, puntos.modo_limitev, puntos.fecha_update
                       FROM conductor INNER JOIN puntos ON conductor.id = puntos.id_conductor WHERE '${rut}' = conductor.rut`;
      console.log(query);
      const client = await pool.connect()
      const result = await client.query(query);
      const results = { 'results': (result) ? result.rows : null};
      res.json(results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  }) 

  //POST DE TODOS LOS CONDUCTORS POR TUTOR, parametro tipo rut
  .get('/tabla_conductor', async (req, res) => {
    try {
      const id = req.param("id"); //se debe ingresar la suma de puntajes que tiene el conductor en todas sus pruebas (sum(modo_libre)..etc)
      const query = `SELECT conductor.apellido_paterno, conductor.apellido_materno, conductor.estado, conductor.nombre, conductor.estado, conductor.rut, 
                     SUM(puntos.modo_libre)/COUNT(puntos.modo_libre) as sum_libre, SUM(puntos.modo_sen)/COUNT(puntos.modo_sen) as sum_senaletica, SUM(puntos.modo_esta)/COUNT(puntos.modo_esta) as sum_estacion,
                     SUM(puntos.modo_sen)+SUM(puntos.modo_esta)+SUM(puntos.modo_peaton)+SUM(puntos.modo_limitev) as resultado,
                     SUM(puntos.modo_peaton)/COUNT(puntos.modo_peaton) as sum_peaton, SUM(puntos.modo_limitev)/COUNT(puntos.modo_limitev) as sum_limite, TO_CHAR(conductor.fecha_ingreso :: DATE, 'Mon dd, yyyy') as fecha_ingreso
                     FROM conductor 
                     INNER JOIN personal ON (conductor.id_personal = personal.id) 
                     INNER JOIN puntos ON (conductor.id = puntos.id_conductor)
                     WHERE '${id}' = personal.id GROUP BY conductor.id_personal, conductor.id`;
      console.log(query);
      const client = await pool.connect()
      const result = await client.query(query);
      const results = { 'results': (result) ? result.rows : null};
      res.json(results); 
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    } 
  })
  
  //POST DATO DE CONDUCTOR INFO POST rut de conductor
  .get('/conductor_info', async (req, res) => {
    try {
      const rut = req.param("rut"); 
      const query = `SELECT conductor.apellido_paterno, conductor.apellido_materno, conductor.estado, conductor.nombre, conductor.estado, conductor.rut, 
                     SUM(puntos.modo_libre)/COUNT(puntos.modo_libre) as sum_libre, SUM(puntos.modo_sen)/COUNT(puntos.modo_sen) as sum_senaletica, SUM(puntos.modo_esta)/COUNT(puntos.modo_esta) as sum_estacion,
                     SUM(puntos.modo_peaton)/COUNT(puntos.modo_peaton) as sum_peaton, SUM(puntos.modo_limitev)/COUNT(puntos.modo_limitev) as sum_limite, TO_CHAR(conductor.fecha_ingreso :: DATE, 'Mon dd, yyyy') as fecha_ingreso
                     FROM conductor 
                     INNER JOIN personal ON (conductor.id_personal = personal.id) 
                     INNER JOIN puntos ON (conductor.id = puntos.id_conductor)
                     WHERE '${rut}' = conductor.rut GROUP BY conductor.id_personal, conductor.id`;
      console.log(query);
      const client = await pool.connect()
      const result = await client.query(query);
      const results = { 'results': (result) ? result.rows : null};
      res.json(results); 
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })

  //POST CRUD de tutor o administrador
  .get('/tabla_personal', async (req, res) => {
    try { 
      const modo = req.param("modo");
      //ingresar
      if(modo == 0){
        const rut = req.param("rut");
        const email = req.param("email");
        const pass = req.param("pass");
        const nombre = req.param("nombre");
        const apellido_p = req.param("apellido_p");
        const apellido_m = req.param("apellido_m");
        const nivel = req.param("nivel");   
        const query = `INSERT INTO login (email, pass) values ('${email}', '${pass}'); 
                       INSERT INTO personal (rut, nombre, apellido_paterno, apellido_materno, nivel, fecha_ingreso) values('${rut}', '${nombre}', '${apellido_p}', '${apellido_m}', '${nivel}', now())`;
        console.log(query);
        const client = await pool.connect()
        const result = await client.query(query);
        const results = { 'results': (result) ? result.rows : null};
        res.json(results); 
      }
      //mostrar todo
      if(modo == 1){
      const query = `SELECT id, log_id, rut, nombre, apellido_paterno, apellido_materno, nivel, TO_CHAR(fecha_ingreso :: DATE, 'DD/MM/YYYY') as fecha_ingreso FROM personal;`;
      console.log(query);
      const client = await pool.connect()
      const result = await client.query(query);
      const results = { 'results': (result) ? result.rows : null};
      res.json(results); 
      client.release();
      }
      //actualizar
      if(modo == 2){

        const rut = req.param("rut");
        const email = req.param("email");
        const pass = req.param("pass");
        const nombre = req.param("nombre");
        const apellido_p = req.param("apellido_p");
        const apellido_m = req.param("apellido_m");
        const nivel = req.param("nivel");  
        const query = `UPDATE login set email = '${email}', pass = '${pass}' WHERE id IN(SELECT log_id FROM personal WHERE rut = '${rut}');
                        UPDATE personal SET  nombre= '${nombre}', apellido_paterno = '${apellido_p}', apellido_materno= '${apellido_m}', nivel='${nivel}' where rut = '${rut}';`;
        console.log(query);
        const client = await pool.connect()
        const result = await client.query(query);
        //console.log(result.rows[0]['id']);
        const results = { 'results': (result) ? result.rows : null};
        res.json(results); 
      }
      //borrar
      if(modo == 3){

        const rut = req.param("rut"); 

        const query = `DELETE FROM login WHERE id IN(SELECT log_id FROM personal WHERE rut = '${rut}'); 
                       DELETE FROM personal WHERE rut = '${rut}';`;
        console.log(query);
        const client = await pool.connect()
        const result = await client.query(query);
        const results = { 'results': (result) ? result.rows : null};
        res.json(results); 

      }
      //mostrar 1
      if(modo == 4){
        const rut = req.param("rut"); 
        const query = `SELECT * FROM personal inner join login on login.id = personal.log_id WHERE rut = '${rut}';`;
        console.log(query);
        const client = await pool.connect()
        const result = await client.query(query);
        const results = { 'results': (result) ? result.rows : null};
        res.json(results); 
        client.release();
      }

      // MOSTRAR ID Y NOMBRE PARA DROWN
      if(modo == 5){
         
        const query = `SELECT nombre FROM personal  WHERE nivel = 'tutor';`;
        console.log(query);
        const client = await pool.connect()
        const result = await client.query(query);
        const results = { 'results': (result) ? result.rows : null};
        res.json(results.results); 
        client.release();
      }

    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })

  //CRUD DE CONDUCTOR O ESTUDIANTES
.get('/crud_conductor', async (req, res) => {
    try { 
      const modo = req.param("modo");
      //ingresar
      if(modo == 0){
        const rut = req.param("rut");
        const nombre = req.param("nombre");
        const apellido_p = req.param("apellido_p");
        const apellido_m = req.param("apellido_m");
        const personal = req.param("name_personal");
        const direc = req.param("direc");   

        const query = `INSERT INTO conductor (rut, nombre, apellido_paterno, apellido_materno, estado, fecha_ingreso, id_personal, direccion) values('${rut}', '${nombre}', '${apellido_p}', '${apellido_m}',true, now(), (select id from personal where nombre = '${personal}'), '${direc}')`;
        console.log(query);
        const client = await pool.connect()
        const result = await client.query(query);
        const results = { 'results': (result) ? result.rows : null};
        res.json(results.results); 
      }
      //mostrar todo
      if(modo == 1){
      const query = `SELECT id, rut, nombre, apellido_paterno, apellido_materno, (select nombre from personal where id = conductor.id_personal) as tutor, TO_CHAR(fecha_ingreso :: DATE, 'DD/MM/YYYY') as fecha_ingreso FROM conductor;`;
      console.log(query);
      const client = await pool.connect()
      const result = await client.query(query);
      const results = { 'results': (result) ? result.rows : null};
      res.json(results.results); 
      client.release();
      }
      //actualizar
      if(modo == 2){

        const rut = req.param("rut");
        const nombre = req.param("nombre");
        const direccion = req.param("direccion");
        const apellido_p = req.param("apellido_p");
        const apellido_m = req.param("apellido_m");
        const tutor = req.param("tutor");  
        const query = `UPDATE conductor SET nombre = '${nombre}', direccion = '${direccion}', apellido_paterno = '${apellido_p}', apellido_materno = '${apellido_m}', id_personal = (select id from personal where nombre = '${tutor}') where rut = '${rut}'  `;
        console.log(query);
        const client = await pool.connect()
        const result = await client.query(query);
        //console.log(result.rows[0]['id']);
        const results = { 'results': (result) ? result.rows : null};
        res.json(results.results); 
      }
      //borrar
      if(modo == 3){

        const rut = req.param("rut"); 

        const query = `DELETE FROM conductor WHERE rut = '${rut}'`;
        console.log(query);
        const client = await pool.connect()
        const result = await client.query(query);
        const results = { 'results': (result) ? result.rows : null};
        res.json(results.results); 

      }
      //mostrar 1
      if(modo == 4){
        const rut = req.param("rut"); 
        const query = `SELECT conductor.rut, conductor.nombre, conductor.apellido_paterno, conductor.apellido_materno, conductor.direccion, personal.nombre as tutor FROM conductor inner join personal on id_personal = personal.id WHERE conductor.rut = '${rut}';`;
        console.log(query);
        const client = await pool.connect()
        const result = await client.query(query);
        const results = { 'results': (result) ? result.rows : null};
        res.json(results.results); 
        client.release();
      }
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })

  .get('/conductor_adm', async (req, res) => {
    try {
      
      const query = `SELECT conductor.apellido_paterno, conductor.apellido_materno, conductor.estado, conductor.nombre, conductor.estado, conductor.rut, 
                     SUM(puntos.modo_libre)/COUNT(puntos.modo_libre) as sum_libre, SUM(puntos.modo_sen)/COUNT(puntos.modo_sen) as sum_senaletica, SUM(puntos.modo_esta)/COUNT(puntos.modo_esta) as sum_estacion,
                     SUM(puntos.modo_sen)+SUM(puntos.modo_esta)+SUM(puntos.modo_peaton)+SUM(puntos.modo_limitev) as resultado,
                     SUM(puntos.modo_peaton)/COUNT(puntos.modo_peaton) as sum_peaton, SUM(puntos.modo_limitev)/COUNT(puntos.modo_limitev) as sum_limite, TO_CHAR(conductor.fecha_ingreso :: DATE, 'Mon dd, yyyy') as fecha_ingreso
                     FROM conductor 
                     INNER JOIN puntos ON (conductor.id = puntos.id_conductor) GROUP BY conductor.id`;
      console.log(query);
      const client = await pool.connect()
      const result = await client.query(query);
      const results = { 'results': (result) ? result.rows : null};
      res.json(results.results); 
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    } 
  })

  .get('/ingresar_puntos', async (req, res) => {
    try {
      
      const rut = req.param("rut");
      const puntaje_t = req.param("contra_t");
      const puntaje_v = req.param("limite_v");
      const puntaje_p = req.param("puntaje_prueba");
      const tipo = req.param("tipo");

      const query = `INSERT INTO puntajes (id_conductor, contra_t, limite_v, puntos_prueba, tipo_prueba, fecha_ingreso) values ((SELECT id from conductor where rut='${rut}'), ${puntaje_t}, ${puntaje_v}, ${puntaje_p}, '${tipo}', now())`; 
      console.log(query);
      const client = await pool.connect()
      const result = await client.query(query);
      const results = { 'results': (result) ? result.rows : null};
      res.json(results.results); 
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    } 
  })


  .listen(PORT, () => console.log(`Listening on ${ PORT }`))  

//AVERIGUAR COMO MANEJAR MENSAJES JSON CON C#