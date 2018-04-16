let controllerModule = function () {

    'use strict';

    let posts = dataModule.posts;

    function getPosts(){
        return posts;
    }

    function setPosts(newPosts) {
        if (!newPosts){
            return;
        }
        let notValid = newPosts.filter((item) => {
            return !validatePost(item);
        });
        if (notValid.length > 0) {
            alert('there are some not valid posts!');
            return;
        }
        posts = newPosts;
    }

    function getNextId(){
        return (posts.length + 1).toString();
    }

    let postSchema = dataModule.postSchema;

    let getPaginatedPosts = function (skip, length, filterConfig) {

        skip = skip || 0;
        length = length || 10;

        let tmpPosts = posts.filter(function (item) {
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

    function addPost(newPost) {
        newPost.id = getNextId();
        newPost.likesFrom = [];
        newPost.active = true;

        if (!validatePost(newPost))
            return false;

        posts.push(newPost);
        return true;
    }

    function editPost(id, input) {
        let oldPost = getPostById(id);
        if (oldPost === undefined) {
            return false;
        }

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
        let postId = posts.findIndex(function (item) {
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
        let postToRemove = getPostById(id);
        if (postToRemove === undefined) {
            return false;
        }
        if (postToRemove.active === false) {
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
        getPosts: getPosts,
        setPosts: setPosts
    }

}();
