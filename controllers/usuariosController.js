const generic = require('./genericController');

const TABLE = 'usuarios';
const ID = 'id_usuario';

exports.getAll = generic.getAll(TABLE);
exports.getOne = generic.getById(TABLE, ID);

exports.create = generic.create(TABLE, [
    'correo',
    'password',
    'rol'
]);

exports.update = generic.update(TABLE, ID, [
    'correo',
    'password',
    'rol'
]);

exports.delete = generic.remove(TABLE, ID);
