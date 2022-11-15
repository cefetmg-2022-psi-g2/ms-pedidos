const { Router } = require("express");
const dbHelper = require("framework");
const Pedido = require("../model/pedido");
const auth = require("../middlewares/auth");
const validator = require("validator");

const router = Router();

// auth é um middleware que verifica se o usuário está logado
router.use((req, res, next) => {
  if (req.method == "POST" || req.originalUrl == "/pedidos/active") {
    auth(req, res, next);
  } else {
    next();
  }
});

// Pega informações do pedido com id=id
router.get("/:id", (req, res, next) => {
  const { id } = req.params;
  if (isNaN(id)) {
    next();
  } else {
    dbHelper
      .selectWhere("pedido", `id=${id}`)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => {
        res.status(500).send("Internal Server Error");
      });
  }
});

// Insere um pedido
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

// Pega todos os pedidos
router.get("/", (req, res) => {
  dbHelper
    .getAllLines("pedido")
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(500).send("Internal Server Error");
    });
});

// Pega todos os pedidos ativos de um usuario identificado por token
router.get("/active", (req, res) => {
  const { user } = req.body;
  if (user) {
    dbHelper
      .selectWhere(
        "pedido",
        `(requester_id=${user.id} OR supplier_id=${user.id}) AND (state='Aberto' OR state='Em Andamento')`
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

// Atende um pedido com id=id e token de usuario
router.post("/attend/:id", (req, res) => {
  const pedidoId = req.params.id;
  const { user } = req.body;
  if (user && pedidoId) {
    if(validator.isInt(pedidoId) && pedidoId > 0){
      dbHelper
      .selectWhere("pedido", `id=${pedidoId}`)
      .then((pedido) => {
        if (pedido[0] && pedido[0].state == "Aberto") {
          if (pedido[0].requester_id != user.id) {
            let date = new Date();
            dbHelper
              .customQuery(
                `UPDATE pedido SET supplier_id=${user.id}, state='Em Andamento', updated_at='${date.toISOString()}' where id=${pedidoId}`
              )
              .then((result) => {
                res.status(200).json(result);
              })
              .catch((err) => {
                console.log(err);
                res.status(500).send("Internal Server Error");
              });
          } else {
            res.status(409).send("Conflict");
          }
        } else {
          res.status(409).send("Pedido não existe ou já foi atendido");
        }
      })
      .catch((err) => {
        res.status(500).send("Internal Server Error");
      });
    }else{
      res.status(400).send("Bad Request");
    }
  } else {
    res.status(400).json("Bad Request");
  }
});

// Finaliza um pedido com id=id e token de usuario
router.post("/finish/:id", (req, res) => {
  const pedidoId = req.params.id;
  const {user} = req.body;
  const {rating} = req.body;
  if (user && pedidoId && rating) {
    if(pedidoId>0 && validator.isInt(pedidoId) && validator.isInt(rating) && rating>=-1 && rating<=1){
      dbHelper.selectWhere("pedido", `id=${pedidoId}`).then((pedido) => {
        pedido = pedido[0];
        if (pedido && pedido.supplier_id==user.id && pedido.state == "Em Andamento") {
          // Pedido atende a todos requisitos para ser fechado
          let date = new Date();
          dbHelper.customQuery(`UPDATE pedido SET state='Fechado', updated_at='${date.toISOString()}' where id=${pedidoId}`).then((result) => {
            res.status(204).json();
            //TODO: Atualizar rating do usuario que fez o pedido.
          }).catch((err) => {
            console.log(err);
            res.status(500).send("Internal Server Error");
          });
        }else{
          res.status(409).send("Pedido não existe ou já foi finalizado");
        }
      }).catch((err) => {
        console.log(err);
        });
    }else{
      res.status(400).send("Bad Request");
    }
  }else{
    res.status(400).send("Bad Request");
  }
});

module.exports = router;
