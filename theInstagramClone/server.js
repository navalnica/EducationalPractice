const   express     = require('express'),
        postsRouter = require('./postsRouter');

const app = express();

const PORT = process.env.PORT || 3000;

app.use('/posts', postsRouter);
app.use(express.static(__dirname + '/static'));

app.listen(3000, () => {
    console.log('server is listening on ' + PORT);
});
