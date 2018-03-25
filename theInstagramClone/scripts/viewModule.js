var viewModule = function () {

    var hashtagBlockTemplate = null;
    var filterHashtagsDiv = null;
    var modalDiv = null;
    var content = null;

    var posts = dataModule.posts;
    var users = dataModule.users;
    var filterConfig = null;

    var currentUser = null;

    // switch type of user
    var isCurrentUserAGuest = false;

    document.addEventListener('DOMContentLoaded', function () {

        filterHashtagsDiv = document.querySelector('.filter-hashtags');
        modalDiv = document.querySelector('.modal');
        hashtagBlockTemplate = document.getElementById('filter-hashtag-block').content;

        var posts = dataModule.posts;

        document.querySelector('#content').addEventListener('click', function (event) {
            if (event.target.closest('.post-image')) {

                // the post image has been clicked
                // call the modal window with post properties

                var id = event.target.closest('.post').getAttribute('id');
                var curPost = controllerModule.getPostById(id);

                modalDiv.innerHTML = "";

                var modalPostTemplate = document.querySelector('#modal-post').content;
                var modalPostNode = document.importNode(modalPostTemplate, true);

                modalPostNode.querySelector(".modal-post-image").querySelector('img').setAttribute('src', curPost.photoLink);

                modalPostNode.querySelector(".modal-post-user").innerText = curPost.user;
                modalPostNode.querySelector(".modal-post-date").innerText = curPost.createdAt.getDate() + '/' +
                    (curPost.createdAt.getMonth() + 1) + "/" + curPost.createdAt.getFullYear();
                modalPostNode.querySelector('.modal-post-description').innerText = curPost.description;

                var hashtags = "";
                curPost.hashtags.forEach(function (tag, index, arr) {
                    hashtags += "#" + tag;
                    if (index < arr.length - 1) {
                        hashtags += " ";
                    }
                });
                modalPostNode.querySelector(".modal-post-hashtags").innerText = hashtags;

                // checks if current user has liked the post
                var isLikedByCurrentUser = (curPost.likesFrom.indexOf(currentUser) >= 0);
                modalPostNode.querySelector('.modal-post-likes-image').querySelector('img').setAttribute('src', (isLikedByCurrentUser) ?
                    'icons/heart_full_32.png' : 'icons/heart_empty_32.png');
                modalPostNode.querySelector(".modal-post-likes-number").innerText = curPost.likesFrom.length;

                if (curPost.user !== currentUser) {
                    modalPostNode.querySelector('.modal-post-delete').style.display = 'none';
                    modalPostNode.querySelector('.modal-post-edit').style.display = 'none';
                }

                modalDiv.appendChild(modalPostNode);
                modalDiv.style.display = 'block';
            }
        });

        window.addEventListener('click', function (event) {
            if (event.target == modalDiv) {
                modalDiv.style.display = 'none';
            }
        });

        document.querySelector('.filter-apply').addEventListener('click', function () {
            var config = {};

            config.user = this.form.elements['filter-user'].value;
            if (this.form.elements['filter-user'].selectedIndex === 0) {
                config.user = null;
            }

            var date = this.form.elements['filter-date'].value;
            if (date) {
                config.date = new Date(date);
            }

            config.hashtags = [];
            var hashtags = this.form.elements['filter-hashtag'];
            for (var i = 0; i < hashtags.length; i++) {
                if (hashtags[i].value) {
                    config.hashtags.push(hashtags[i].value);
                }
            }

            console.log('config of the filter:');
            console.log(config);
            setFilterConfig(config);
            refreshPosts();
        });

        document.querySelector('.filter-clear').addEventListener('click', function () {
            clearFilterFields();
            refreshPosts();
        });

        filterHashtagsDiv.addEventListener('keyup', function (event) {
            var hashtagBlock = event.target.closest('.hashtag-block');

            if (hashtagBlock.nextElementSibling == null) {
                if (event.target.value) {
                    // the string is not empty
                    addNewHashtagBlock();
                    event.target.parentElement.querySelector('.hashtag-remove-button').style.display = 'block';
                }
            }
        });

        filterHashtagsDiv.addEventListener('focusout', function (event) {
            if (event.target.tagName.toLowerCase() === 'input') {
                if (!event.target.value) {
                    // the string in hashtag input is empty. should remove that block
                    var hashtagBlock = event.target.closest('.hashtag-block');

                    if (filterHashtagsDiv.childElementCount > 1 && hashtagBlock.nextElementSibling != null) {
                        // if current hashtag block is not the only one and not the last one
                        removeHashtagBlock(hashtagBlock);
                    }
                }
            }
        });

        filterHashtagsDiv.addEventListener('click', function (event) {
            if (event.target.tagName.toLowerCase() == 'button') {
                var hashtagBlock = event.target.closest('.hashtag-block');
                removeHashtagBlock(hashtagBlock);
            }
        });

        // ------- commands

        init();

    });

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

        posts = controllerModule.getPaginatedPosts(0, 30, filterConfig);

        content.innerHTML = "";
        var postTemplate = document.getElementById("post-template").content;

        var i = 0;
        while (posts && i < posts.length) {

            var postNode = document.importNode(postTemplate, true);
            var curPost = controllerModule.getPostById(posts[i].id);

            postNode.querySelector('.post').setAttribute('id', curPost.id);
            postNode.querySelector(".post-user").innerText = "user: " + curPost.user;
            postNode.querySelector(".post-date").innerText = curPost.createdAt.getDate() + '/' +
                (curPost.createdAt.getMonth() + 1) + "/" + curPost.createdAt.getFullYear();
            postNode.querySelector(".post-image").querySelector('img').setAttribute('src', curPost.photoLink);

            // checks if current user has liked the post
            postNode.querySelector('.post-likes-image').querySelector('img').setAttribute('src', (curPost.likesFrom.indexOf(currentUser) >= 0) ?
                'icons/heart_full_32.png' : 'icons/heart_empty_32.png');
            postNode.querySelector(".post-likes-number").innerText = curPost.likesFrom.length;

            var hashtags = "";
            curPost.hashtags.forEach(function (tag, index, arr) {
                hashtags += "#" + tag;
                if (index < arr.length - 1) {
                    hashtags += " ";
                }
            });
            postNode.querySelector(".post-hashtags").innerText = hashtags;

            content.appendChild(postNode);
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

    function fillUserSelectWithOptions() {
        var select = document.querySelector('#filter-user');

        var option = document.createElement("option");
        option.text = 'all users';
        select.add(option);

        for (var i = 0; i < users.length; i++) {
            option = document.createElement("option");
            option.text = users[i];
            select.add(option);
        }
    }

    function addNewHashtagBlock() {
        var newHashtagBlock = document.importNode(hashtagBlockTemplate, true);
        newHashtagBlock.querySelector('.hashtag-remove-button').style.display = 'none';
        filterHashtagsDiv.appendChild(newHashtagBlock);
    }

    function removeHashtagBlock(hashtagBlock) {
        filterHashtagsDiv.removeChild(hashtagBlock);
    }

    function init() {

        content = document.getElementById('content');

        if (isCurrentUserAGuest) {
            setCurrentUser('some other user');
        }
        else {
            setCurrentUser('koscia');
        }
        setFilterConfig(null);
        fillUserSelectWithOptions();
        refreshPosts();

    }

    return {
        refreshPosts: refreshPosts
    }

}();

// ------- testing functions in global scope ------------

function addPhotoPost() {
    var newPost =
        {
            id: '100',
            user: 'the_new_user',
            description: 'this is the post created in the addPhotoPost method',
            createdAt: new Date('2018-05-22T23:00:00'),
            photoLink: 'photos/img5.jpeg',
            hashtags: ['car'],
            likesFrom: ['admin'],
            active: true
        };

    if (controllerModule.addPost(newPost)) {
        console.log('new photo post added');
        viewModule.refreshPosts();
    } else {
        console.log('adding new photo post failed');
    }
}

function removePhotoPost(id) {
    if (controllerModule.removePost(id)) {
        console.log('post with id ' + id + ' successfully deleted');
        viewModule.refreshPosts();
    }
    else {
        console.log('deletion failed. maybe wrong id passed to the method');
    }
}

function editPhotoPost(id, toEdit) {
    /* notice that only following fields are editable:
        description
        photoLink
        hashtags
        likesFrom
     */

    if (controllerModule.editPost(id, toEdit)) {
        console.log('post with id ' + id + ' successfully edited');
        viewModule.refreshPosts();
    }
    else {
        console.log('editing failed');
    }

}

function test() {
    editPhotoPost('18', {
        description: 'this is the new description. the post was edited. ' +
        'likesFrom array alse edited', likesFrom: ['koscia']
    });

    for (var i = 1; i < 15; i++) {
        removePhotoPost('' + i);
    }

    addPhotoPost();
}