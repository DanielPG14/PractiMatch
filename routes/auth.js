const express = require('express');
const router = express.Router();
const { login, registrar, logout } = require('../controllers/login');
const {obtenerTodos} = require('../controllers/consultas');
router.post('/login', login);
router.post('/registro', registrar);
router.post('/logout', logout);
router.get('/datos/:nombreTabla', obtenerTodos);

module.exports = router;