const generic = require('./genericController');

const TABLE = 'estudiantes';
const ID = 'id_estudiante';

exports.getAll = generic.getAll(TABLE);
exports.getOne = generic.getById(TABLE, ID);

exports.create = generic.create(TABLE, [
    'id_usuario',
    'matricula',
    'carrera',
    'rfc'
]);

exports.update = generic.update(TABLE, ID, [
    'id_usuario',
    'matricula',
    'carrera',
    'rfc'
]);

exports.delete = generic.remove(TABLE, ID);
