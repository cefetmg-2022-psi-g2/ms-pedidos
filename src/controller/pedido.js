const { Router } = require("express");
const dbHelper = require("framework");
const Pedido = require("../model/pedido");
const auth = require("../middlewares/auth");
const validator = require("validator");
const axios = require("axios");

const router = Router();

// auth é um middleware que verifica se o usuário está logado
router.use((req, res, next) => {
  if (req.method == "POST" || req.originalUrl == "/pedidos/active") {
    auth(req, res, next);
  } else {
    next();
  }
});

router.get("/:id", (req, res, next) => {
  const { id } = req.params;
  if (isNaN(id)) {
    next();
  } else {
    dbHelper
      .selectWhere("pedido", `id=${id}`)
      .then((result) => {
        //Populate new array with user info
        if(result.lenght != 0){
          let join = [];
        result.forEach(pedido => {
          axios.get("http://164.92.92.152:4000/auth/"+pedido.requester_id).then(result=>{
            if(result.status==200){
              delete pedido.requester_id;
            pedido.requester = result.data;
            join.push({pedido});
            res.status(200).json(pedido);
            }else{
              res.status(502).send("bad gateway")
            }
          }).catch(err=>{
            if(err.code=='ERR_BAD_REQUEST'){
              res.status(502).send("Bad Gateway");
            }else{
              res.status(500).send("Internal Server Error");
            }
          })
        });
        }else{
          res.status(404).send("not found")
        }
      })
      .catch((err) => {
        res.status(500).send("Internal Server Error");
        console.log(err)
      });
  }
});

router.post("/", (req, res) => {
  const {
    token,
    name,
    category_id,
    building_id,
    description,
    localization,
    campus,
  } = req.body;
  if (
    token &&
    name &&
    category_id &&
    building_id &&
    description &&
    localization &&
    campus
  ) {
    Pedido.createPedido(
      req.body.user.id,
      name,
      category_id,
      building_id,
      description,
      localization,
      campus
    )
      .then((result) => {
        console.log(result);
        if (result != false) {
          console.log(result);
          let time = new Date();
          console.log("id:" + result.requester_id);
          dbHelper
            .insertInto(
              "pedido",
              [
                "requester_id",
                "supplier_id",
                "state",
                "name",
                "category_id",
                "building_id",
                "description",
                "localization",
                "created_at",
                "updated_at",
                "campus",
              ],
              [
                result.requester_id,
                null,
                "Aberto",
                result.name,
                result.category_id,
                result.building_id,
                result.description,
                result.localization,
                time.toISOString(),
                time.toISOString(),
                result.campus_id,
              ]
            )
            .then((result) => {
              res.status(200).json(result);
            })
            .catch((err) => {
              res.status(500).send("Internal Server Error");
            });
        } else {
          //bad request
          res.status(400).send("Bad Request");
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Internal Server Error");
      });
  } else {
    res.status(400).json("Bad Request");
  }
});

router.get("/", (req, res) => {
  dbHelper
    .getAllLines("pedido")
    .then((result) => {
      result = result.filter(pedido => pedido.state=="Aberto");
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(500).send("Internal Server Error");
    });
});

router.get("/active", (req, res) => {
  const { user } = req.body;
  if (user) {
    dbHelper
      .selectWhere(
        "pedido",
        `(requester_id=${user.id} OR supplier_id=${user.id}) AND state='Aberto'`
      )
      .then((result) => {
        console.log(result);
        res.status(200).json(result);
      })
      .catch((err) => {
        res.status(500).send("Internal Server Error");
      });
  }
});

router.post("/:id", (req, res) => {
  res.send("debug");
  /*let { id } = req.params;
  id += "";
  if (id && validator.isInt(id) && id > 0) {
    dbHelper
      .selectWhere("pedido", `(id=${id})`)
      .then((result) => {
        if (result) {
          if (result.requester_id != id) {
            dbHelper
              .customQuery(
                `update pedido set state = 'Atendido', supplier_id='${req.body.user.id}' where id=${id};`
              )
              .then(() => {
                res.status(204).send();
              })
              .catch((err) => {
                res.status(500).send("Internal Server Error");
              });
          } else {
            res.status(404).json("not found");
          }
        }
      })
      .catch((err) => {
        res.status(500).json("Internal Server Error");
      });
  }*/
});

module.exports = router;
