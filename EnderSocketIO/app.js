const express = require('express');
const path = require('path');
const app = express();
const JWT = require('jsonwebtoken');
require('dotenv').config();
const http = require('http'); 
const cors = require('cors');
const { Server } = require('socket.io');
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://ender:KKuD5moTmApqdbct@web2.qru6b.mongodb.net/?retryWrites=true&w=majority&appName=Web2";

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
const server = http.createServer(app);

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

async function BDUser() {
    try {
      await client.connect(); 
      const dataBase = client.db('usuarios');
      return dataBase 
    } catch (error) {
      console.error("Error al conectar con la base de datos", error);
    } 
  }
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
    }

});

io.on('connection', (socket) => {
    console.log('El usuario se ha unido al chat');
    socket.on('message', (msg) => {
        console.log('Usuario dice--->:', msg);
        io.emit('message', msg);
    });
    socket.on('disconnect', () => {
        console.log('El usuario se ha desconectado del Chat');
    });
});

app.get('/logIn',  (req, res) => {
    res.sendFile(path.join(__dirname,'/index.html'));
});

app.get('/token', validacionDeToken, (req, res) => {
    res.send("Su tonken de autenticacion esta validado");
});



async function autenticarUser(username, password) {
    try {
        const dataBase = await BDUser();
        const usuariosCollection = dataBase.collection('user');
        const user = await usuariosCollection.findOne({usuario: username, contrasenna: password});
       
        if (user) {
            return { success: true, message: "La autenticación exitosa" };
        } else {
            return { success: false, message: "El Usuario o la contraseña estan incorrectos" };
        }
    } catch (error) {
        console.error("Error al intentar autenticar el  usuario:", error);
        
    }
}


app.post('/autenticar', async (req, res) => {
    const {username, password } = req.body;
    const atenticacion = await autenticarUser(username, password);
    if (atenticacion.success) {
        const usuario = { password: password };
        const tokenDeAcceso = asignarTokenDeAcceso(usuario);
        res.header('authorization', tokenDeAcceso).json({
            message: 'El usuario ha sido autenticado con exito',
            token: tokenDeAcceso
        });
    } else {
        res.json({ message: atenticacion.message });
    }
});

function asignarTokenDeAcceso(usuario) {
    return JWT.sign(usuario, process.env.SECRET, { expiresIn: '45m' });
}


function validacionDeToken(req, res, next) {
    const tokeDeAcceso = req.header['authorization'] || req.query.tokeDeAcceso;
    if (!tokeDeAcceso) {
        return res.send('Acceso no permitido por token');
    }
    
    JWT.verify(tokeDeAcceso, process.env.SECRET, (err) => {
        if (err) {
            return res.send('no se pudo acceder, el token expiro o esta incorrecto');
        } else {
            next();
        }
    });
}


const port = 3001;
server.listen(port, () => {
    console.log('Se ha iniciado el Chat');
});
