const express = require('express');
const fs = require('fs');

const router = express.Router();

let activePostsCollection = null;
const pathToPostJsonFile = './posts.json';

// path are accessible from the client html page
const pathToLikedIcon = 'icons/heart_full_32.png';
const pathToNotLikedIcon = 'icons/heart_empty_32.png';

router.post('/getFilteredPosts', function (req, res) {
    activePostsCollection = readJsonFromFileSync(pathToPostJsonFile);
    activePostsCollection.forEach((post) => {
        correctCreatedAtFieldInPostAfterJsonParse((post))
    });

    const body = req.body;
    if (body.filterConfig) {
        correctDateFieldInFilterConfigAfterJsonParse(body.filterConfig);
    }

    activePostsCollection = getPaginatedPosts(activePostsCollection,
        body.filterConfig, req.app.get('currentUserName'), body.numOfPostsToSkip, body.numOfPostsToLoad);

    // automatically stringifies passed object
    res.send(activePostsCollection);
});

router.put('/delete', function (req, res) {
    console.log('-----------------');
    console.log('processing /posts/delete request');

    const id = req.body.id;
    const postsCollection = readJsonFromFileSync(pathToPostJsonFile);
    if (!deletePost(postsCollection, id)) {
        res.status(400).send('attempting to delete existing post or could not find post with such id');
    }
    else {
        saveJsonToFileSync(postsCollection, pathToPostJsonFile);
        res.sendStatus(200);
    }
});

router.put('/edit', (req, res) => {
    console.log('-----------------');
    console.log('processing /posts/edit request');

    const id = req.body.id;
    const newData = req.body.newData;
    const postsCollection = readJsonFromFileSync(pathToPostJsonFile);

    if (!editPost(postsCollection, id, newData)) {
        res.status(400).send('error while editing post');
    }
    else {
        saveJsonToFileSync(postsCollection, pathToPostJsonFile);
        res.sendStatus(200);
    }
});

router.put('/getSinglePost', (req, res) => {
    const id = req.body.id;
    let post = getPostById(activePostsCollection, id);
    post.isEditable = (req.app.get('currentUserName') === post.user);
    res.send(post);
});

router.put('/add', (req, res) => {
    // TODO upload image and set link to it in the new post
    console.log('-----------------');
    console.log('processing /posts/add request');

    let newPostData = req.body.newPostData;
    correctCreatedAtFieldInPostAfterJsonParse(newPostData);
    newPostData.user = req.app.get('currentUserName');
    const postsCollection = readJsonFromFileSync(pathToPostJsonFile);

    if (!addPost(postsCollection, newPostData)) {
        res.status(400).send('error while adding new post');
    }
    else {
        saveJsonToFileSync(postsCollection, pathToPostJsonFile);
        res.sendStatus(200);
    }
});

router.put('/addLike', (req, res) => {
    const userName = req.app.get('currentUserName');
    if (!userName){
        res.sendStatus(400);
    }
    else{
        const postId = req.body.id;
        let postsCollection = readJsonFromFileSync(pathToPostJsonFile);
        let post = postsCollection.find(p => p.id === postId);
        const ix = post.likesFrom.indexOf(userName);
        if (ix >= 0) {
            post.likesFrom.splice(ix, 1);
            saveJsonToFileSync(postsCollection, pathToPostJsonFile);
            res.send({icon: pathToNotLikedIcon, count: post.likesFrom.length});
        }
        else {
            post.likesFrom.push(userName);
            saveJsonToFileSync(postsCollection, pathToPostJsonFile);
            res.send({icon: pathToLikedIcon, count: post.likesFrom.length});
        }
    }
});

// ----------- functions ------------------

function readJsonFromFileSync(filepath) {
    const file = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(file);
}

function saveJsonToFileSync(data, filepath) {
    fs.writeFileSync(filepath, JSON.stringify(data), 'utf-8');
}

function correctCreatedAtFieldInPostAfterJsonParse(post) {
    const dateString = post.createdAt;
    post.createdAt = new Date(dateString);
}

function correctDateFieldInFilterConfigAfterJsonParse(filterConfig) {
    const dateString = filterConfig.date;
    if (!dateString) {
        return;
    }
    filterConfig.date = new Date(dateString);
}

function getPaginatedPosts(postsCollection, filterConfig,
                           currentUserName, numOfPostToSkip, numOfPostsToLoad) {

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

    tmpPosts.forEach(post => {
        if (post.likesFrom.indexOf(currentUserName) >= 0) {
            post.pathToLikeIcon = pathToLikedIcon;
        }
        else {
            post.pathToLikeIcon = pathToNotLikedIcon;
        }
    });

    return tmpPosts.slice(numOfPostToSkip, numOfPostToSkip + numOfPostsToLoad);
}

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
        if (postSchema.hasOwnProperty(key)) {
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

function editPost(postsCollection, id, input) {
    let oldPost = getPostById(postsCollection, id);
    if (!oldPost) {
        return false;
    }
    correctCreatedAtFieldInPostAfterJsonParse(oldPost);

    // creating a copy of the oldPost object
    let editedPost = Object.assign({}, oldPost);

    for (let prop in input) {
        if (input.hasOwnProperty(prop)) {
            if (input[prop] === null || input[prop] === undefined) {
                return false;
            }
            if (!editedPost.hasOwnProperty(prop)) {
                return false;
            }
            switch (prop) {
                case 'description':
                case 'photoLink': {
                    editedPost[prop] = input[prop];
                }
                    break;

                case 'hashtags':
                case 'likesFrom': {
                    editedPost[prop] = input[prop].slice();
                }
                    break;

                default:
                    return false;
            }
        }
    }

    if (!validatePost(editedPost))
        return false;

    // replace old post with the new one
    let postId = postsCollection.findIndex(function (item) {
        return item.id === id;
    });
    postsCollection[postId] = editedPost;
    return true;
}

function addPost(postsCollection, newPost) {
    newPost.id = (postsCollection.length + 1).toString();
    newPost.likesFrom = [];
    newPost.active = true;

    if (!validatePost(newPost))
        return false;

    postsCollection.push(newPost);
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
