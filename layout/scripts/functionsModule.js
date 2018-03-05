// TODO: add likes to the post

var posts = dataModule.posts;

var functionsModule = function () {

    // TODO
    var getPaginatedPosts = function (skip, number, filterConfig) {
        skip = typeof skip !== "undefined" ? skip : 0;
        number = typeof number !== "undefined" ? number : 10;
        filterConfig = typeof filterConfig === "string" ? filterConfig : 'date';


        return {}
    };


    function getPostById(id) {
        if (id === undefined)
            return undefined;

        return posts.find(function (p) {
            return p.id === id;
        });
    }

    function validatePost(post) {
        if (post === undefined)
            return false;

        if (post.id == undefined)
            return false;
        if (typeof post.id !== "string")
            return false;
        if (post.id.length === 0)
            return false;

        if (post.author == undefined)
            return false;
        if (typeof post.author !== "string")
            return false;
        if (post.author.length === 0)
            return false;

        if (post.description == undefined)
            return false;
        if (typeof post.description !== 'string')
            return false;
        if (post.description.length >= 200 ||
            post.description.length === 0)
            return false;

        if (post.createdAt == undefined)
            return false;
        if (!post.createdAt instanceof Date)
            return false;

        if (post.photoLink == undefined)
            return false;
        if (typeof post.photoLink !== "string")
            return false;
        if (post.photoLink.length === 0)
            return false;


        return true;
    }

    function addPhotoPost(newPost) {
        if (!validatePost(newPost))
            return false;

        // check if element with the same id exists in array
        if (posts.some(function (element) {
                return element.id === newPost.id;
            }))
            return false;

        posts.push(newPost);
        return true;
    }

    // the editedPost object should not be valid
    // it can contain only fields that need to be altered
    function editPost(id, editedPost) {
        if (id === undefined)
            return false;
        if (!validatePost(editedPost))
            return false;

        var postsId = posts.map(function (element) {
            return element.id;
        });
        var i = postsId.indexOf(id);
        if (i === -1)
            return false;

        posts[i] = editedPost;
        return true;
    }

    function removePost(id){
        if (id === undefined)
            return false;

        var postsId = posts.map(function (element) {
            return element.id;
        });
        var i = postsId.indexOf(id);
        if (i === -1)
            return false;

        posts.splice(i, 1);
        return true;
    }

    /*
        --------------------
        subsidiary functions to test the module
        --------------------
     */

    function validateAllPosts() {
        posts.forEach(function (item) {
            console.log('post id: ' + item.id + '; validation result: ' + validatePost(item));
        });
    }

    function tryAddNewPost() {
        var p = {
            author: 'new author',
            createdAt: new Date(),
            description: 'some fancy description',
            id: 'uu014',
            photoLink: 'just the link'
        };
        return addPhotoPost(p);
    }

    function tryEditPost() {
        var id = '2';
        var old = getPostById(id);
        old.author = 'edited author!';
        return editPost(id, old);
    }

    function tryRemovePost(){
        var id = '1';
        return removePost(id);
    }

    return {
        getPaginatedPosts: getPaginatedPosts,
        getPostById: getPostById,
        validatePost: validatePost,
        editPost: editPost,
        removePost: removePost,

        validateAllPosts: validateAllPosts,
        tryAddNewPost: tryAddNewPost,
        tryEditPost: tryEditPost,
        tryRemovePost: tryRemovePost
    }

}();