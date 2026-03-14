const { obtenerUsuarios, crearUsuario } = require('../models/model_usuarios');
const bcrypt = require('bcrypt');

async function login(req, res) {
    const { correo, contrasena } = req.body;
    try {
        const response = await obtenerUsuarios(correo);
        if (response.length === 0) {
            return res.status(404).json({ mensaje: "Correo no registrado" });
        }
        const usuario = response[0];
        const passwordValido = await bcrypt.compare(contrasena, usuario.password); // Bcrypt para comparar contraseñas hasheadas
        if (!passwordValido) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }
        req.session.usuario = { //Permite consultarlo para saber si el usuario esta o sigue logeado 
            id: usuario.id_usuario,
            correo: usuario.correo,
            rol: usuario.rol
        };
        res.json({ mensaje: "Login exitoso", rol: usuario.rol });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).json({ mensaje: "Error al iniciar sesión" });
    }
}

async function registrar(req, res) {
    const {correo, contrasena, rol} = req.body;
    console.log("Datos de registro:", req.body);
    try {
        const existingUser = await obtenerUsuarios(correo);
        if (existingUser.length > 0) {
            return res.status(409).json({ mensaje: "Correo ya registrado" });
        }
        const hash = await bcrypt.hash(contrasena, 10);
        const response = await crearUsuario(correo, hash, rol);
        res.status(201).json({ mensaje: "Usuario registrado exitosamente", id: response.insertId });

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ mensaje: "Error al registrar usuario" });
    }
}

async function logout(req, res) {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ mensaje: "Error al cerrar sesión" });
        }
        res.json({ mensaje: "Sesión cerrada exitosamente" });
    });
}

module.exports = { login, registrar, logout };