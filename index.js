require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const session = require('express-session');

//middleware 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Rutas
app.use('/api/auth', require('./routes/auth'));

// Ruta al login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/login_view.html'));
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Verificar la conexión a la base de datos
const db = require("./config/database");

async function verificarConexion() {
    try {
        await db.query("SELECT 1");
        console.log("Conexion a MySQL exitosa");
    } catch (error) {
        console.log("Error de conexion:", error.message);
    }
}

verificarConexion();