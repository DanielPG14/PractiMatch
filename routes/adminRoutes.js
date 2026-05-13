const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');

router.get('/dashboard', controller.getDashboard);

// router.get('/usuarios', controller.getAllUsers);
// router.get('/empresas/pendientes', controller.getPendingCompanies);

module.exports = router;