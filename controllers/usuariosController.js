const generic = require('./genericController');

const TABLE = 'usuarios';
const ID = 'id_usuario';

exports.getAll = generic.getAll(TABLE);
exports.getOne = generic.getById(TABLE, ID);

// CORREGIDO: Se agregaron 'rfc' y 'nombre' a los campos permitidos del modelo genérico de usuarios
exports.create = generic.create(TABLE, [
    'nombre',
    'correo',
    'password',
    'rfc',
    'rol'
]);

exports.update = generic.update(TABLE, ID, [
    'nombre',
    'correo',
    'password',
    'rfc',
    'rol'
]);

exports.delete = generic.remove(TABLE, ID);