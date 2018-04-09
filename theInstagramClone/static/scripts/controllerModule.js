var controllerModule = function () {

    'use strict';

    var posts = dataModule.posts;

    var nextId = '0';

    (function getNextId(){
        posts.forEach((item)=>{
            if (parseInt(item.id) > parseInt(nextId)){
                nextId = item.id;
            }
        });
        incrementNextId();
    })();

    var postSchema = dataModule.postSchema;

    function incrementNextId(){
        nextId = (parseInt(nextId) + 1).toString();
    }

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
        newPost.id = nextId;
        incrementNextId();
        newPost.likesFrom = [];
        newPost.active = true;

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
        if (postToRemove.active == false){
            return false;
        }
        postToRemove.active = false;
        return true;
    }

    return {
        getPaginatedPosts: getPaginatedPosts,
        getPostById: getPostById,
        addPost: addPost,
        editPost: editPost,
        removePost: removePost,
    }

}();
