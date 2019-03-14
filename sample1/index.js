const express = require('express')
var mdb = require('./ug5kmdb.js');
var app = express();

/** Insertar un documento */
var template = {
    title: String,
    author: String,
    body: String,
    comments: [{ body: String, date: Date }],
    date: { type: Date, default: Date.now },
    hidden: Boolean,
    meta: {
        votes: Number,
        favs: Number
    }
};
var document = {
    title: "Documento de Prueba",
    author: "AGL",
    body: "Este el documento....",
    comments: []
};
var collection = 'testdoc';
var query = { author: "AGL" };
var model = mdb.Model(collection, template);

/** Funcion MAIN */
async function main() {
    app.get('/', (req, res) => res.send('Hello World!'))
    app.listen(3000, () => console.log('Example app listening on port 3000!'))

    /** Conexion a la base de datos */
    await mdb.Connect();
    /** Creando un documento */
    // await mdb.Create(model, document);

    /** Leyendo documentos */
    var res = await mdb.Read(model, query);
    var data = res;

    /** Actualizando documentos */
    res = await mdb.Update(model, { hidden: true }, query);

    /** Borrando documentos */
    res = await mdb.Delete(model, { hidden: true });
}

main();

