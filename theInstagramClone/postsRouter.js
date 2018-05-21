const express = require('express');
const bodyParser = require ('body-parser');

const router = express.Router();
const jsonParser = bodyParser.json();

router.get('/get', jsonParser, function (req, res) {
     console.log('Get response for paginated posts collection');
    console.log('filter body:');
    const body = req.body;
    console.log(body);

    res.send('some message');
});

router.post('/add', function (req, res) {
    console.log('POST handler for /posts/add route.');
    console.log('new post body:');
    console.log(req.body);
});

module.exports = router;
