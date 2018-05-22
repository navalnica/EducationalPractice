const express = require('express'),
    postsRouter = require('./postsRouter'),
    bodyParser = require('body-parser');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname + '/static'));

app.use('/posts', postsRouter);

app.listen(3000, () => {
    console.log('server is listening on ' + PORT);
});
