var functionsModule = function () {

    'use strict';

    var posts = dataModule.posts;

    var postSchema = {
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

    var getPaginatedPosts = function (skip, length, filterConfig) {

        skip = skip || 0;
        length = length || 10;

        var tmpPosts = posts.filter(function (item) {
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

        return tmpPosts.slice(skip, skip + length);
    };


    function getPostById(id) {
        if (id === undefined) {
            return;
        }
        if (id.constructor.name !== postSchema.id.constructorName) {
            return;
        }

        return posts.find(function (p) {
            return p.id === id;
        });
    }

    function validatePost(p) {
        if (!p) {
            return false;
        }

        if (Object.keys(postSchema).length !== Object.keys(p).length) {
            return false;
        }

        for (var key in postSchema) {
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
                var b = true;
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

        return true;
    }

    function addPost(newPost) {
        if (!validatePost(newPost))
            return false;

        var prevPost = getPostById(newPost.id);
        if (prevPost) {
            return false;
        }

        posts.push(newPost);
        return true;
    }

    function editPost(id, input) {
        var oldPost = getPostById(id);
        if (oldPost === undefined) {
            return false;
        }

        // creating a copy of the oldPost object
        var editedPost = Object.assign({}, oldPost);

        for (var prop in input) {
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
        var postId = posts.findIndex(function (item) {
            return item.id === id;
        });
        if (postId === -1)
            return false;

        posts[postId] = editedPost;
        return true;
    }

    // we do not remove posts permanently
    // but only set 'active' field to falsef
    function removePost(id) {
        var postToRemove = getPostById(id);
        if (postToRemove === undefined) {
            return false;
        }
        postToRemove.active = false;
        return true;
    }

    /*
        --------------------
        testing functions
        --------------------
     */

    function test() {
        // --------------- printing all the posts --------------------
        console.log('all the posts:');
        console.log(posts);

        // --------------- validating --------------------
        console.log('--------------- validating --------------------');
        var notValid = posts.filter(function (item) {
            return validatePost(item) === false;
        });
        console.log('not valid posts:');
        console.log(notValid);

        // --------------- getting posts by id --------------------
        console.log('--------------- getting posts by id --------------------');

        console.log('var uPost = getPostById(\'uu-3\');');
        var uPost = getPostById('uu-3');
        console.log(uPost);

        console.log('var p = getPostById(\'3\'): ');
        var p = getPostById('3');
        console.log(p);


        // --------------- paginating posts --------------------
        console.log('--------------- paginating posts --------------------');
        var paginated = getPaginatedPosts(null, null, {user: 'admin'});
        console.log('admin\'s posts:');
        console.log(paginated);

        paginated = getPaginatedPosts(3, 2, {user: 'admin'});
        console.log('2 admin\'s posts starting from 3rd:');
        console.log(paginated);

        paginated = getPaginatedPosts(0, 0, {date: new Date('2018-03-21T23:00:00')});
        console.log('posts created on 2018-03-21:');
        console.log(paginated);

        paginated = getPaginatedPosts(0, 0, {
            date: new Date('2018-03-21T23:00:00'),
            user: 'koscia'
        });
        console.log('posts created on 2018-03-21 by \'koscia\':');
        console.log(paginated);

        console.log('paginating with illegal filterConfig parameter:');
        paginated = getPaginatedPosts(0, 0, {user: 3});
        console.log(paginated);

        paginated = getPaginatedPosts(0, 0, {user: 'koscia', hashtags: ["sunset"]});
        console.log("posts with 'sunset' hashtag:");
        console.log(paginated);
        console.table(paginated, ['id', 'user', 'hashtags']);

        // --------------- adding new posts --------------------
        console.log('--------------- adding new posts --------------------');
        var newPost1 = {
            id: 'unique-1',
            description: "new posts 1",
            createdAt: new Date('2018-2-23T23:00:00'),
            user: 'admin',
            photoLink: '/photos/newPost1',
            hashtags: [],
            likesFrom: ['arsieni', 'admin'],
            active: true
        };
        console.log('newPost1:');
        console.log(newPost1);
        console.log('addPost(newPost1):');
        console.log(addPost(newPost1));

        var newPost2 = {
            id: 'unique-2',
            description: "new posts 2",
            createdAt: new Date('2018-2-23T23:00:00'),
            user: 'admin',
            photoLink: '/photos/newPost2',
            active: true,
            extraProperty: 'cool property'
        };
        console.log('newPost2:');
        console.log(newPost2);
        console.log('addPost(newPost2):');
        console.log(addPost(newPost2));

        var newPost3 = {
            id: '1',
            description: "new posts 3",
            createdAt: new Date('2018-2-23T23:00:00'),
            user: 'admin',
            photoLink: '/photos/newPost3',
            hashtags: ['firstTag', 'seondTag'],
            likesFrom: ['arsieni', 'admin'],
            active: true
        };
        console.log('newPost3:');
        console.log(newPost3);
        console.log('addPost(newPost3):');
        console.log(addPost(newPost3));


        console.log('all the posts after adding new posts:');
        console.log(posts);

        // --------------- editing posts --------------------
        console.log('--------------- editing posts --------------------');

        var indexToEdit = 4;
        console.log('indexToEdit: ' + indexToEdit);
        console.log('posts[indexToEdit]:');
        console.log(posts[indexToEdit]);

        var toEdit1 = {
            description: "First description",
            photoLink: "../photos/firstLink.jpg",
            hashtags: ['testing', 'hashtags'],
            likesFrom: ['admin', 'admin', 'admin']
        };
        console.log('toEdit1 object:');
        console.log(toEdit1);
        console.log('editPost(indexToEdit, toEdit1):');
        console.log(editPost(posts[indexToEdit].id, toEdit1));
        console.log('posts[indexToEdit]:');
        console.log(posts[indexToEdit]);

        var toEdit2 = {
            description: null
        };
        console.log('toEdit2 object:');
        console.log(toEdit2);
        console.log('editPost(indexToEdit, toEdit2):');
        console.log(editPost(posts[indexToEdit].id, toEdit2));
        console.log('posts[indexToEdit]:');
        console.log(posts[indexToEdit]);

        var toEdit3 = {
            description: "third description",
            photoLink: ""
        };
        console.log('toEdit3 object:');
        console.log(toEdit3);
        console.log('editPost(indexToEdit, toEdit3):');
        console.log(editPost(posts[indexToEdit].id, toEdit3));
        console.log('posts[indexToEdit]:');
        console.log(posts[indexToEdit]);

        // --------------- removing posts --------------------
        console.log('--------------- removing posts --------------------');

        console.log('removePost(p.id)');
        removePost(p.id);
        console.log(p);

        console.log('removePost(\'uuu13\')');
        console.log(removePost('uuu13'));

        //------------------- resulting posts ------------------
        console.log('resulting posts:');
        console.log(posts);
    }

    return {
        getPaginatedPosts: getPaginatedPosts,
        getPostById: getPostById,
        addPost: addPost,
        validatePost: validatePost,
        editPost: editPost,
        removePost: removePost,

        test: test
    }

}();
