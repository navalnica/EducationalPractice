const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const postsRouter = require('./routers/postsRouter');
const socket = require ('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;
const pathToUsersJsonFile = './users.json';
app.use(bodyParser.json());

app.use(express.static(__dirname + '/static'));

const server = app.listen(3000, () => {
    console.log('server is listening on ' + PORT);
});

const io = socket(server);
const reloadUserSocketMessage = 'reloadUser';
const reloadPostsSocketMessage = 'reloadPosts';
io.on('connection', (socket)=>{
    console.log(`<-- connection to socket -->`);
    console.log(`socket id: ${socket.id}`);

    socket.on(reloadUserSocketMessage, ()=>{
        // send message to all sockets except current one
        socket.broadcast.emit(reloadUserSocketMessage);
    });

    socket.on(reloadPostsSocketMessage, ()=>{
        socket.broadcast.emit(reloadPostsSocketMessage);
    });

    console.log('<-- end of connection event -->');
});

app.use('/posts', postsRouter);

app.get('/getCurrentUserName', (req, res)=>{
    res.send(app.get('currentUserName'));
});

app.get('/getUsersList', (req, res) => {
    const users = readJsonFromFileSync(pathToUsersJsonFile);
    const reducedUsersCollection = users.map(user => {
        return user.name
    });
    res.send(reducedUsersCollection);
});

app.put('/authenticate', (req, res) => {
    const name = req.body.name;
    const password = req.body.password;
    const usersCollection = readJsonFromFileSync(pathToUsersJsonFile);

    const user = usersCollection.find((user) => {
        return user.name === name && user.password === password;
    });
    if (user){
        // set global variable
        app.set('currentUserName', user.name);
        res.sendStatus(200);
        console.log('--- authentication succeded ---');
    }
    else{
        res.sendStatus(400);
        console.log('--- authentication failed ---');
    }
});

app.put('/logout', (req, res)=>{
    app.set('currentUserName', null);
    res.sendStatus(200);
});


// ----------- functions
function readJsonFromFileSync(filepath) {
    const file = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(file);
}