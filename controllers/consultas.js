const{listarTodos} = require('../models/model_consultas');

async function obtenerTodos(req, res){
    const{ nombreTabla }= req.params;
    try{
        const datos = await listarTodos(nombreTabla);

        if(datos.length === 0){
            return res.status(404).json({mensaje: "Tabla vacia, valio vg sr barriga"})
        }
        return res.status(200).json(datos);
    }catch(err){
        console.error("Error en el controlador de consultas: ", err);
        res.status(500).json({mensaje: "Error al obtener datos de la tabla"});
    }
}
module.exports = { obtenerTodos};