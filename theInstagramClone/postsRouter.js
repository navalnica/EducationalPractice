const   express = require('express'),
        fs      = require('fs');

const pathToPostJsonFile = './posts.json';

const router = express.Router();

router.post('/getFilteredPosts', function (req, res) {
    console.log('-----------------');
    console.log('POST request for filtered posts collection');

    const postsCollection = readJsonFromFileSync(pathToPostJsonFile);
    postsCollection.forEach((post)=>{
        correctCreatedAtFieldInPostAfterJsonParse((post))
    });

    const body = req.body;
    if (body.filterConfig){
        correctDateFieldInFilterConfigAfterJsonParse(body.filterConfig);
    }

    const filteredPostsCollection = getPaginatedPosts(postsCollection,
        body.filterConfig, body.numOfPostsToSkip, body.numOfPostsToLoad);

    // automatically stringifies passed object
    res.send(filteredPostsCollection);
});

router.put('/delete', function(req, res){
    console.log('-----------------');
    console.log('processing /posts/delete request')

    const id = req.body.id;
    const postsCollection = readJsonFromFileSync(pathToPostJsonFile);
    if (!deletePost(postsCollection, id)){
        res.status(400).send('attempting to delete existing post or could not find post with such id');
    }
    else{
        saveJsonToFileSync(postsCollection, pathToPostJsonFile);
        res.status(200).send('all ok');
    }
});


// ----------- functions ------------------

function readJsonFromFileSync(filepath){
    const file = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(file);
}

function saveJsonToFileSync(data, filepath){
    fs.writeFileSync(filepath, JSON.stringify(data), 'utf-8');
}

function correctCreatedAtFieldInPostAfterJsonParse(post){
    const dateString = post.createdAt;
    post.createdAt = new Date(dateString);
}

function correctDateFieldInFilterConfigAfterJsonParse(filterConfig){
    const dateString = filterConfig.date;
    if (!dateString){
        return;
    }
    filterConfig.date = new Date(dateString);
}

function getPaginatedPosts (postsCollection, filterConfig, numOfPostToSkip, numOfPostsToLoad) {

    numOfPostToSkip = numOfPostToSkip || 0;
    numOfPostsToLoad = numOfPostsToLoad || 10;

    let tmpPosts = postsCollection.filter(function (item) {
        return item.active && validatePost(item);
    });

    // sort by date
    tmpPosts.sort(function (a, b) {
        return b.createdAt - a.createdAt;
    });

    if (filterConfig) {

        if (filterConfig.date) {
            if (filterConfig.date.constructor.name === 'Date') {
                tmpPosts = tmpPosts.filter(function (item) {
                    return item.createdAt.toDateString() === filterConfig.date.toDateString();
                })
            }
            else {
                return;
            }
        }

        if (filterConfig.user) {
            if (filterConfig.user.constructor.name === 'String') {
                tmpPosts = tmpPosts.filter(function (item) {
                    return item.user === filterConfig.user;
                });
            }
            else {
                return;
            }
        }

        if (filterConfig.hashtags) {
            if (filterConfig.hashtags.constructor.name !== 'Array') {
                return;
            }
            tmpPosts = tmpPosts.filter(function (post) {
                return filterConfig.hashtags.every(function (tag) {
                    return post.hashtags.indexOf(tag) >= 0;
                });
            });
        }

    }

    return tmpPosts.slice(numOfPostToSkip, numOfPostToSkip + numOfPostsToLoad);
};

function getPostById(postsCollection, id) {
    if (!id) {
        return;
    }
    if (id.constructor.name !== postSchema.id.constructorName) {
        return;
    }

    return postsCollection.find(function (p) {
        return p.id === id;
    });
}

function deletePost(postsCollection, id) {
    let postToRemove = getPostById(postsCollection, id);
    if (!postToRemove || postToRemove.active === false) {
        return false;
    }
    postToRemove.active = false;
    return true;
}

function validatePost(p) {
    if (!p) {
        return false;
    }

    if (Object.keys(postSchema).length !== Object.keys(p).length) {
        return false;
    }

    for (let key in postSchema) {
        if (postSchema.hasOwnProperty(key)){
            if (p[key] === undefined || p[key] === null) {
                return false;
            }
            if (postSchema[key].constructorName !== p[key].constructor.name) {
                return false;
            }
            if (postSchema[key].constructorName === 'String') {
                if (p[key].length < postSchema[key].minLength ||
                    p[key].length > postSchema[key].maxLength) {
                    return false;
                }
            }
            if (postSchema[key].constructorName === 'Array') {
                let b = true;
                p[key].forEach(function (item) {
                    if (item.constructor.name !== postSchema[key].elementsConstructorName) {
                        b = false;
                    }
                });
                if (!b) {
                    return false;
                }
            }
        }
    }

    return true;
}

// -------------- post schema ------------------
let postSchema = {
    id: {
        constructorName: 'String',
        minLength: 1,
        maxLength: 200
    },
    user: {
        constructorName: 'String',
        minLength: 1,
        maxLength: 200
    },
    description: {
        constructorName: 'String',
        minLength: 1,
        maxLength: 200
    },
    createdAt: {constructorName: 'Date'},
    photoLink: {
        constructorName: 'String',
        minLength: 1,
        maxLength: 1000
    },
    hashtags: {
        constructorName: 'Array',
        elementsConstructorName: 'String'
    },
    likesFrom: {
        constructorName: 'Array',
        elementsConstructorName: 'String'
    },
    active: {constructorName: 'Boolean'}
};

module.exports = router;
