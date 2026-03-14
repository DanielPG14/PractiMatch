function verificarSesion(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({ mensaje: "No autenticado" });
    }
    next();
}

function verificarRol(...roles) {
    return function(req, res, next) {
        if (!roles.includes(req.session.usuario.rol)) {
            return res.status(403).json({ mensaje: "No tienes permiso para acceder aquí" });
        }
        next();
    }
}

module.exports = { verificarSesion, verificarRol };