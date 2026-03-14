const express = require('express');
const router = express.Router();
const { login, registrar, logout } = require('../controllers/login');

router.post('/login', login);
router.post('/registro', registrar);
router.post('/logout', logout);

module.exports = router;