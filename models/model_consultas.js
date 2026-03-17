const db= require('../config/database'); //la misma ruta xd
async function listarTodos(tabla){
    try{
        const [rows] = await db.query('SELECT * FROM ??',[tabla]);
        //const [rows] = await db.query('SELECT * FROM usuarios'); //Cambiar esto por la consulta dinamica, pero por ahora lo dejo asi para probar
        return rows;
    }catch(err){
        console.log(`Error al listar todos de la tabla: ${tabla}`, err);
        throw err;
    }
}
module.exports = {listarTodos};
