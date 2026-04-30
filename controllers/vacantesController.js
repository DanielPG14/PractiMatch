const generic = require('./genericController');

const TABLE = 'vacantes';
const ID = 'id_vacante';

exports.getAll = generic.getAll(TABLE);
exports.getOne = generic.getById(TABLE, ID);

exports.create = generic.create(TABLE, [
    'id_empresa',
    'tipo_proceso',
    'descripcion',
    'fecha_creacion'
]);

exports.update = generic.update(TABLE, ID, [
    'id_empresa',
    'tipo_proceso',
    'descripcion',
    'fecha_creacion'
]);

exports.delete = generic.remove(TABLE, ID);
