const http = require('http');
const fs = require('fs');

const pathToStatic = 'static';

const server = http.createServer((request, response) => {

    console.log('request to the %s', request.url);

    const path = (request.url !== '/') ? pathToStatic + request.url : pathToStatic + '/index.html';
    console.log('path: %s', path);

    fs.readFile(path, (error, file) => {
        if (error) {
            response.writeHead(404);
            response.write("The file %s not found", request.url);
            console.log("The file %s not found", request.url);
        } else {
            response.writeHead(200);
            response.write(file);
        }

        response.end();
    });


});

server.listen(3000);

console.log('listening on port 3000');
