const   express = require('express'),
        fs      = require('fs');

const router = express.Router();

router.post('/getFilteredPosts', function (req, res) {
    console.log('-----------------');
    console.log('POST response for filtered posts collection');

    const postsCollection = readJsonFileSync('./posts.json');
    postsCollection.forEach((post)=>{
        correctCreatedAtFieldInPostAfterJsonParse((post))
    });

    const body = req.body;
    correctDateFieldInFilterConfigAfterJsonParse(body.filterConfig);

    const filteredPostsCollection = getPaginatedPosts(postsCollection,
        body.filterConfig, body.numOfPostsToSkip, body.numOfPostsToLoad);

    res.send(filteredPostsCollection);
});


// ----------- functions ------------------

function readJsonFileSync(filepath){
    const file = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(file);
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

let getPaginatedPosts = function (postsCollection, filterConfig, numOfPostToSkip, numOfPostsToLoad) {

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

// -------------- post chema ------------------
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
