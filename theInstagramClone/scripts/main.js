var mainModule = function () {

    'use strict';

    var posts = dataModule.posts;
    var users = dataModule.users;
    var filterConfig = null;
    var currentUser = null;

    var content;

    function setCurrentUser(username) {
        currentUser = username;
        var navButtons = document.querySelector('.header-nav');

        if (users.indexOf(currentUser) >= 0) {
            document.querySelector('.current-user-name').innerText = currentUser;

            navButtons.querySelector('#my-photos').style.display = 'block';
            navButtons.querySelector('#upload-photo').style.display = 'block';
            navButtons.querySelector('#log-out').style.display = 'block';

            navButtons.querySelector('#log-in').style.display = 'none';
        }
        else {
            document.querySelector('.current-user-name').innerText = 'Guest';

            navButtons.querySelector('#my-photos').style.display = 'none';
            navButtons.querySelector('#upload-photo').style.display = 'none';
            navButtons.querySelector('#log-out').style.display = 'none';

            navButtons.querySelector('#log-in').style.display = 'block';
        }
    }

    function refreshPosts() {

        posts = functionsModule.getPaginatedPosts(0, 30, filterConfig);

        content.innerHTML = "";
        var postTemplate = document.getElementById("post-template").content;

        var i = 0;
        while (posts && i < posts.length) {

            var curPost = document.importNode(postTemplate, true);

            curPost.querySelector('.post').setAttribute('id', posts[i].id);
            curPost.querySelector(".post-user").innerText = "user: " + posts[i].user;
            curPost.querySelector(".post-date").innerText = posts[i].createdAt.getDate() + '/' +
                (posts[i].createdAt.getMonth() + 1) + "/" + posts[i].createdAt.getFullYear();
            curPost.querySelector(".post-image").querySelector('img').setAttribute('src', posts[i].photoLink);

            // checks if current user has liked the post
            curPost.querySelector('.post-likes-image').querySelector('img').setAttribute('src', (posts[i].likesFrom.indexOf(currentUser) >= 0) ?
                'icons/heart_full_32.png' : 'icons/heart_empty_32.png');
            curPost.querySelector(".post-likes-number").innerText = posts[i].likesFrom.length;

            var hashtags = "";
            posts[i].hashtags.forEach(function (tag, index, arr) {
                hashtags += "#" + tag;
                if (index < arr.length - 1) {
                    hashtags += " ";
                }
            });
            curPost.querySelector(".post-hashtags").innerText = hashtags;

            content.appendChild(curPost);
            i++;

        }

    }

    function setFilterConfig(config) {
        filterConfig = config;
    }

    function clearFilterFields() {

        var filterForm = document.forms['filter-form'];
        filterForm.elements['filter-date'].value = null;
        filterForm.elements['filter-user'].selectedIndex = 0;

        var filterHashtagsDiv = document.querySelector('.filter-hashtags');
        while (filterHashtagsDiv.firstElementChild != filterHashtagsDiv.lastElementChild) {
            filterHashtagsDiv.removeChild(filterHashtagsDiv.firstChild);
        }

        filterConfig = null;

    }

    function fillUserSelectWithOptions(){
        var select = document.querySelector('#filter-user');

        var option = document.createElement("option");
        option.text = 'all users';
        select.add(option);

        for (var i = 0; i < users.length; i++){
            option = document.createElement("option");
            option.text = users[i];
            select.add(option);
        }
    }

    function init() {

        content = document.getElementById('content');

        setCurrentUser('koscia');
        setFilterConfig(null);
        fillUserSelectWithOptions();
        refreshPosts();

    }

    // ------- testing functions ------------
    function addPhotoPost() {
        var newPost =
            {
                id: '100',
                user: 'another_guy',
                description: 'some fancy descriptions',
                createdAt: new Date('2018-05-22T23:00:00'),
                photoLink: 'photos/img5.jpeg',
                hashtags: ['car'],
                likesFrom: ['admin'],
                active: true
            };

        console.log('adding new photo post');
        functionsModule.addPost(newPost);
        setFilterConfig(null);
        refreshPosts();
    }

    function removePhotoPost() {
        var postToRemove = posts[1];
        if (postToRemove) {
            console.log('removing the second post');
            functionsModule.removePost(postToRemove.id);
        }
        else {
            if (posts.length > 0) {
                console.log('removing the first post');
                functionsModule.removePost(posts[0].id);
            }
            else {
                console.log('could not remove any post. no posts left');
            }
        }
        refreshPosts();
    }

    return {
        init: init,
        setFilterConfig: setFilterConfig,
        refreshPosts: refreshPosts,
        clearFilterFields: clearFilterFields,

        addPhotoPost: addPhotoPost,
        removePhotoPost: removePhotoPost
    }

}();