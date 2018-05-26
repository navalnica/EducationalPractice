const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const postsRouter = require('./postsRouter');

const app = express();

const PORT = process.env.PORT || 3000;

const pathToUsersJsonFile = './users.json';

app.use(bodyParser.json());
app.use(express.static(__dirname + '/static'));

app.use('/posts', postsRouter);

app.get('/getUsersList', (req, res) => {
    console.log('-----------');
    console.log('processing /posts/getUsersList request');

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
    }
    else{
        res.sendStatus(400);
    }
});

app.put('/logout', (req, res)=>{
   app.set('currentUserName', null);
   res.sendStatus(200);
});

app.listen(3000, () => {
    console.log('server is listening on ' + PORT);
});


// ----------- functions
function readJsonFromFileSync(filepath) {
    const file = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(file);
}