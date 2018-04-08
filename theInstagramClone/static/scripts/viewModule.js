var viewModule = function () {

    var hashtagBlockTemplate = null;
    var modalPostTemplate = null;
    var filterHashtagsDiv = null;
    var modalDiv = null;
    var content = null;

    var posts = dataModule.posts;
    var users = dataModule.users;
    var filterConfig = null;

    var numberOfVisiblePosts = 0;
    var numberOfPostsToLoad = 10;

    // switch type of user
    var currentUserIx = -1;

    document.addEventListener('DOMContentLoaded', function () {

        filterHashtagsDiv = document.querySelector('.filter-hashtags');
        hashtagBlockTemplate = document.querySelector('#filter-hashtag-block').content;
        modalDiv = document.querySelector('.modal-container');
        modalPostTemplate = document.querySelector('#modal-post').content;
        modalLoginPopup = document.querySelector('#modal-login-popup').content;

        document.querySelector('#content').addEventListener('click', function (event) {
            if (event.target.closest('.post-image')) {

                // the post image has been clicked
                // call the modal window with post properties

                var id = event.target.closest('.post').getAttribute('id');
                var curPost = controllerModule.getPostById(id);

                modalDiv.innerHTML = "";
                var modalPostNode = document.importNode(modalPostTemplate, true);

                fillPostTemplateWithData(modalPostNode, curPost, true);
                if (currentUserIx < 0 || curPost.user !== users[currentUserIx].name) {
                    modalPostNode.querySelector('.modal-post-delete').style.display = 'none';
                    modalPostNode.querySelector('.modal-post-edit').style.display = 'none';
                }
                modalDiv.appendChild(modalPostNode);

                modalDiv.style.display = 'block';
            }
        });

        document.querySelector('#log-in').addEventListener('click', () => {
            modalDiv.innerHTML = "";
            var loginPopupNode = document.importNode(modalLoginPopup, true);
            modalDiv.appendChild(loginPopupNode);
            modalDiv.style.display = 'block';

            this.querySelector('.login-form-submit').addEventListener('click', () => {
                var form = document.querySelector('#login-form');
                var name = form.elements['login-form-name'].value;
                var password = form.elements['login-form-password'].value;

                var ix = users.findIndex((element) => {
                    return element.name === name && element.password === password;
                });

                if (ix > -1){
                    setCurrentUserByIndex(ix);
                    modalDiv.style.display = 'none';
                }
                else{
                    document.querySelector('.authentication-failed-span').style.display = 'block';
                }
            });
        });

        document.querySelector('#log-out').addEventListener('click', () => {
            setCurrentUserByIndex(-1);
        });

        document.querySelector('#my-photos').addEventListener('click', () => {
            setFilterConfig({user: users[currentUserIx].name});
            loadFirstPartOfThePosts();
        });

        window.addEventListener('click', function (event) {
            if (event.target === modalDiv) {
                // hide the modal window
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

            setFilterConfig(config);
            loadFirstPartOfThePosts();
        });

        document.querySelector('.filter-clear').addEventListener('click', function () {
            clearFilterFields();
            loadFirstPartOfThePosts();
        });

        document.querySelector('.load-more-button').addEventListener('click', () => {
            loadMorePosts();
        });

        filterHashtagsDiv.addEventListener('keyup', function (event) {
            var hashtagBlock = event.target.closest('.hashtag-block');

            if (hashtagBlock.nextElementSibling === null) {
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
            if (event.target.tagName.toLowerCase() === 'button') {
                var hashtagBlock = event.target.closest('.hashtag-block');
                removeHashtagBlock(hashtagBlock);
            }
        });

        // ------- commands on document load ---------

        init();

    });

    function fillPostTemplateWithData(postNode, postObject, isDescriptionPresent) {
        postNode.querySelector(".post-image").querySelector('img').setAttribute('src', postObject.photoLink);

        postNode.querySelector(".post-user").innerText = postObject.user;
        postNode.querySelector(".post-date").innerText = postObject.createdAt.getDate() + '/' +
            (postObject.createdAt.getMonth() + 1) + "/" + postObject.createdAt.getFullYear();
        if (isDescriptionPresent) {
            postNode.querySelector('.post-description').innerText = postObject.description;
        }

        var hashtags = "";
        postObject.hashtags.forEach(function (tag, index, arr) {
            hashtags += "#" + tag;
            if (index < arr.length - 1) {
                hashtags += " ";
            }
        });
        postNode.querySelector(".post-hashtags").innerText = hashtags;

        // checks if current user has liked the post
        var isLikedByCurrentUser = currentUserIx > -1 && (postObject.likesFrom.indexOf(users[currentUserIx].name) >= 0);
        postNode.querySelector('.post-likes-image').querySelector('img').setAttribute('src', (isLikedByCurrentUser) ?
            'icons/heart_full_32.png' : 'icons/heart_empty_32.png');
        postNode.querySelector(".post-likes-number").innerText = postObject.likesFrom.length;

    }

    function setCurrentUserByIndex(index) {
        currentUserIx = index;
        var navButtons = document.querySelector('.header-nav');

        if (currentUserIx > -1){
            document.querySelector('.current-user-name').innerText = users[currentUserIx].name;

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

        var content = document.querySelector('#content');
        for (var i = 0; i < content.childElementCount; i++){
            var curId = content.children[i].getAttribute('id');
            var curPost = controllerModule.getPostById(curId);
            var isLikedByCurrentUser = currentUserIx > -1 && (curPost.likesFrom.indexOf(users[currentUserIx].name) >= 0);
            content.children[i].querySelector('.post-likes-image').querySelector('img').setAttribute('src', (isLikedByCurrentUser) ?
                'icons/heart_full_32.png' : 'icons/heart_empty_32.png');
        }
    }

    function loadFirstPartOfThePosts() {

        posts = controllerModule.getPaginatedPosts(0, numberOfPostsToLoad, filterConfig);
        numberOfVisiblePosts = posts.length;

        content.innerHTML = "";
        var postTemplate = document.getElementById("post-template").content;

        var i = 0;
        while (posts && i < posts.length) {

            var postNode = document.importNode(postTemplate, true);
            var curPost = controllerModule.getPostById(posts[i].id);

            postNode.querySelector('.post').setAttribute('id', curPost.id);
            fillPostTemplateWithData(postNode, curPost, false);

            content.appendChild(postNode);
            i++;

        }
    }

    function loadMorePosts(event) {
        posts = controllerModule.getPaginatedPosts(numberOfVisiblePosts, numberOfPostsToLoad, filterConfig);
        numberOfVisiblePosts += posts.length;

        var postTemplate = document.getElementById("post-template").content;

        var i = 0;
        while (posts && i < posts.length) {

            var postNode = document.importNode(postTemplate, true);
            var curPost = controllerModule.getPostById(posts[i].id);

            postNode.querySelector('.post').setAttribute('id', curPost.id);
            fillPostTemplateWithData(postNode, curPost, false);

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
        while (filterHashtagsDiv.firstElementChild !== filterHashtagsDiv.lastElementChild) {
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
            option.text = users[i].name;
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

        setCurrentUserByIndex(1);
        setFilterConfig(null);
        fillUserSelectWithOptions();
        loadFirstPartOfThePosts();

    }

}();
