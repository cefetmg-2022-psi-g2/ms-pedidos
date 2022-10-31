const validator = require("validator");
const dbHelper = require("framework");

const Pedido = {
    validatePedido: (
        requester_id,
        name,
        category_id,
        building_id,
        description,
        localization,
        campus_id
    ) => {
        if (
            requester_id && // requester_id is a number
            name && // name is a string beetwen 1 and 100 characters
            category_id && // category_id is a number
            building_id && // building_id is a number
            description && // description is a string beetwen 1 and 1000 characters
            localization && // localization is a string beetwen 1 and 100 characters
            campus_id // campus is a number
        ) {
            if (
                validator.isInt(requester_id) &&
                validator.isInt(category_id) &&
                validator.isInt(building_id) &&
                validator.isInt(campus_id)
            ) {
                if (validator.isLength(name, { min: 1, max: 100 })) {
                    if (validator.isLength(description, { min: 1, max: 1000 })) {
                        if (validator.isLength(localization, { min: 1, max: 100 })) {
                            // Check category_id, building_id and campus existance
                            return new Promise((resolve, reject) => {
                                Promise.all([
                                    validateLocalExistence("campus", campus_id),
                                    validateLocalExistence("categoria", category_id),
                                    validateLocalExistence("predio", building_id),
                                ])
                                    .then((result) => {
                                        if (result[0] && result[1] && result[2]) {
                                            resolve(true);
                                        }
                                        resolve(false);
                                    })
                                    .catch((err) => {
                                        reject(false);
                                    });
                            });
                        }
                    }
                }
            }
        }
    },
    createPedido: (
        requester_id,
        name,
        category_id,
        building_id,
        description,
        localization,
        campus_id
    ) => {
        return new Promise((resolve, reject) => {
            Pedido.validatePedido(requester_id, name, category_id, building_id, description, localization, campus_id).then((result) => {
                if (result) {
                    //valido
                    //Limpando os dados para evitar SQL Injection e XSS
                    
                    resolve({
                        requester_id,
                        name,
                        category_id,
                        building_id,
                        description,
                        localization,
                        campus_id
                    })
                } else {
                    resolve(false);//bad request
                }
            }).catch((err) => {
                reject(-1);//erro interno
            });
        });
    }
};

function validateLocalExistence(table, id) {
    return new Promise((resolve, reject) => {
        dbHelper
            .customQuery(`SELECT * FROM ${table} WHERE id = ${id}`)
            .then((result) => {
                if (result.length > 0) {
                    resolve(true);
                }
                resolve(false);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

module.exports = Pedido;
