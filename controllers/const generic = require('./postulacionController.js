const generic = require('./genericController');

const TABLE = 'postulaciones';
const ID = 'id_postulacion';

exports.getAll = generic.getAll(TABLE);
exports.getOne = generic.getById(TABLE, ID);

exports.create = generic.create(TABLE, [
    'id_estudiante',
    'id_vacante',
    'estatus',
    'fecha_postulacion'
]);

exports.update = generic.update(TABLE, ID, [
    'id_estudiante',
    'id_vacante',
    'estatus',
    'fecha_postulacion'
]);

exports.delete = generic.remove(TABLE, ID);
