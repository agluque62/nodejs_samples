var mongoose = require('mongoose');
var config = {
	host: "192.168.0.212", 
	database: "test",
	user: "",
	password: ""
};
var status = {
};

/** INTERNALS */
function internal_db_connect(db_uri)
{
	return new Promise(function(resolve,reject) {
		mongoose.connect(db_uri, {useNewUrlParser: true }).then(
			() => {
				resolve({conn: mongoose.connection.db, error: null});
			},
			err => {
				resolve({conn: null, error: err});
			});
	});
}

function internal_db_create(model, document) {
    return new Promise(function (resolve, reject) {
        var doc = new model(document);
        doc.save(function (err) {
            if (err)
                resolve({ error: err });
            else {
                resolve({ error: null });
            }
        });
    });
}

function internal_db_read(model, query) {
    return new Promise(function (resolve, reject) {
        model.find(query, function (err, docs) {
            if (err) {
                resolve({ error: err });
            }
            else {
                resolve({ error: null, data: docs });
            }
        });
    });
}

function internal_db_update(model, document, query) {
    return new Promise(function (resolve, reject) {
        model.updateMany(query, document, function (err, raw) {
            if (err) {
                resolve({ error: err });
            }
            else {
                resolve({ error: null, data: raw });
            }
        });
    });
}

function internal_db_delete(model, query, many) {
    return new Promise(function (resolve, reject) {
        if (many) {
            model.deleteMany(query, function (err, data) {
                resolve(err ? { error: err } : { error: null, data: data });
            });
        }
        else {
            model.deleteOne(query, function (err, data) {
                resolve(err ? { error: err } : { error: null, data: data });
            });
        }
    });
}

/** EXTERNALS */
async function DbConnect() {
    var dbUri = 'mongodb://' + config.host + '/' + config.database;
    console.log('Conectando a ' + dbUri);

    var res = await internal_db_connect(dbUri);
    if (res.error) {
        console.log('Error conectando a ' + dbUri, res.error.name, res.error.message);
        status.db = null;
    }
    else {
        console.log('Conectado a ' + dbUri);
        status.db = res.conn;
    }
}

function DbModel(collection, template) {
    var schema = new mongoose.Schema(template);
    var model = mongoose.model(collection, schema);
    return model;
}

async function DbCreate(model, document) {
    if (status.db == null) {
        console.log("Error insertando documento", model.modelName, "Base de datos no abierta");
    }
    else {
        var res = await internal_db_create(model, document);
        if (res.error) {
            console.log('Error insertando documento ', model.modelName, res.error.name, res.error.message);
        }
        else {
            console.log('Documento insertado en ', model.modelName);
            return true;
        }
    }
    return false;
}

async function DbRead(model, query) {
    if (status.db == null) {
        console.log("Error leyendo coleccion ", model.modelName, "Base de datos no abierta");
    }
    else {
        var res = await internal_db_read(model, query);
        if (res.error) {
            console.log('Error leyendo documento ', model.modelName, res.error.name, res.error.message);
        }
        else {
            console.log('Leidos ', res.data.length, 'documentos de ', model.modelName);
            return res.data;
        }
    }
    return false;
}

async function DbUpdate(model, document, query) {
    if (status.db == null) {
        console.log("Error actualizando coleccion ", model.modelName, "Base de datos no abierta");
    }
    else {
        var res = await internal_db_update(model, document, query);
        if (res.error) {
            console.log('Error actualizando documento ', model.modelName, res.error.name, res.error.message);
        }
        else {
            console.log('Actualizados ', res.data, 'documentos de ', model.modelName);
            return res.data;
        }
    }
    return false;
}

async function DbDelete(model, query, many) {
    if (status.db == null) {
        console.log("Error eliminando documento de coleccion ", model.modelName, "Base de datos no abierta");
    }
    else {
        var res = await internal_db_delete(model, query, many);
        if (res.error) {
            console.log('Error borrando documento ', model.modelName, res.error.name, res.error.message);
        }
        else {
            console.log('Elimiandos ', res.data, 'documentos de ', model.modelName);
            return res.data;
        }
    }
    return false;
}

/** Exports... */
exports.Connect = DbConnect;
exports.Model = DbModel;
exports.Create = DbCreate;
exports.Read = DbRead;
exports.Update = DbUpdate;
exports.Delete = DbDelete;

/*
var gcfg = require('../configUlises.json');
var logging = require('./nu-log.js');
var log = gcfg.Ulises.dblogEnable != undefined ? gcfg.Ulises.dblogEnable : true; 

if (!global.QueryCount) global.QueryCount = 0;

function Query(query, param1, cbRes, nolog) {
    var QueryCount = (++global.QueryCount);
    var connection = GetDbConnection();

    logging.Trace(log, BuildStrQuery(QueryCount, query, param1));
    connection.connect(function(mysqlerr) {
        if (mysqlerr) {
            logging.Trace(log, BuildStrResult(mysqlerr));
            cbRes(mysqlerr);
            connection.end();
        }
        else {
            connection.query(query, param1, function(mysqlerr, rows, fields) {
                connection.end();
                logging.Trace(log && !nolog, BuildStrResult(QueryCount, mysqlerr, rows));
                cbRes(mysqlerr, rows, fields);
            });
        }
    });
}

function QueryWithPromise(query, param1, nolog) {
    return new Promise(function(resolve, rejects) {
        Query(query, param1, function(err, rows, fields) {
            if (err) {
                resolve({ error: err });
            }
            else {
                resolve({ error: null, data: rows });
            }
        }, nolog);
    });
}

async function QuerySync(query, param1, nolog) {
    var res = await QueryWithPromise(query, param1, nolog);
    return res;
}

//
async function QueryMultiInsertSync(query, par) {
    var qrys = await QueryWithPromise(query, null, false);
    return qrys;
}

//
function BuildStrQuery(QueryCount, query, param) {
    var res = "[UG5KDBV2] Query(" + QueryCount.toString() + "): ";
    if (query) res += (query + " ");
    if (param) {
        res += "PAR: ";
        if (Array.isArray(param)) {
            param.forEach(function(item, index) {
                res += (JSON.stringify(item) + ", ");
            });
        }
        else {
            res += (JSON.stringify(param) + ", ");
        }
    }
    res += "==>";
    return res;
}

function BuildStrResult(QueryCount, err, result) {
    var res = "[UG5KDBV2] RES(" + QueryCount.toString() + "): ";
    if (err) {
        res += ("ERROR: " + err);
    }
    else {
        if (!Array.isArray(result)) {
            res += JSON.stringify(result);
        }
        else {
            result.forEach(function(item, index) {
                res += (JSON.stringify(item) + '\r\n');
            });
        }
    }
    return res;
}

function BuildStrResultCount(QueryCount, err, result) {
    var res = "[UG5KDBV2] RES(" + QueryCount.toString() + "): ";
    if (err) {
        res += ("ERROR: " + err);
    }
    else {
        if (Array.isArray(result)) {
            res += (result.length.toString() + " Registros Leidos");
        }
    }
    return res;
}

// 20180829. Unificar la creacion de conexiones 
function GetDbConnection() {
    return mySql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_BASE,
        multipleStatements: true
    });
}

function GetDbConnectionOnTz(tz) {
    return mySql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_BASE,
        multipleStatements: true,
        timezone: tz
    });

}
*/

/**/
// exports.Query = Query;
// exports.QueryWithPromise = QueryWithPromise;
// exports.QuerySync = QuerySync;
// exports.QueryMultiInsertSync = QueryMultiInsertSync;
// exports.GetDbConnection = GetDbConnection;
// exports.GetDbConnectionOnTz = GetDbConnectionOnTz;
