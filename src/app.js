const express = require('express')
const dbHelper = require('framework');
const path = require('path');
require('dotenv').config({ path: './../.env'})
const errorHandler = require('./middlewares/errorHandler');
const bodyParser = require('body-parser');
const app = express()
const port = 3000

// Database init and config
const dbPath  = './../data/pedidos.sqlite';
dbHelper.init(dbPath);

// Body parser config with error handler
app.use((req,res,next)=>{
    errorHandler(bodyParser.json(), req,res,next);
})

// Routes
app.use('/pedidos', require('./controller/pedido'));

//debug
const Pedido = require('./model/pedido');
app.get('/', (req, res) => {
    Pedido.createPedido(
        '1',"teste",'1','1',"teste","teste",'1'
    ).then((result) => {
        res.json(result);
    });
})

app.listen(port, () => console.log(`MS-pedidos restarted on: ${port}, DB_PATH: ${dbPath}`));