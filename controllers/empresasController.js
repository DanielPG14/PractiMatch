const generic = require('./genericController');

const TABLE = 'empresas';
const ID = 'id_empresa';

exports.getAll = generic.getAll(TABLE);
exports.getOne = generic.getById(TABLE, ID);

exports.create = generic.create(TABLE, [
    'id_usuario',
    'nombre_empresa',
    'estado',
    'rfc'
]);

exports.update = generic.update(TABLE, ID, [
    'id_usuario',
    'nombre_empresa',
    'estado',
    'rfc'
]);

exports.delete = generic.remove(TABLE, ID);
