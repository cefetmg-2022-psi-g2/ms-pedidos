const { Router } = require("express");
const dbHelper = require("framework");
const Pedido = require("../model/pedido");
const auth = require("../middlewares/auth");

const router = Router();

// auth é um middleware que verifica se o usuário está logado
router.use((req, res, next) => {
  auth(req, res, next);
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  dbHelper
    .selectWhere("pedido", `id=${id}`)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(500).send("Internal Server Error");
    });
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
      "1",
      name,
      category_id,
      building_id,
      description,
      localization,
      campus
    )
      .then((result) => {
        if (result != false) {
            let time = new Date();
          dbHelper.insertInto(
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
            [result.requester_id, null, 'Aberto', result.name, result.category_id, result.building_id, result.description, result.localization, time.toISOString(), time.toISOString, result.campus]
          ).then((result) => {
            res.status(200).json(result);
          }).catch((err) => {
            res.status(500).send("Internal Server Error");
          });
        } else {
          //bad request
          res.status(400).send("Bad Request");
        }
      })
      .catch((err) => {
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
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(500).send("Internal Server Error");
    });
});

module.exports = router;
