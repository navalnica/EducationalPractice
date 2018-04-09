var viewModule = function () {

    var hashtagBlockTemplate = null;
    var modalPostTemplate = null;
    var modalEditingTemplate = null;
    var modalLoginPopup = null;
    var filterHashtagsDiv = null;
    var editingHashtagsDiv = null;
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
        modalEditingTemplate = document.querySelector('#modal-editing').content;
        modalLoginPopup = document.querySelector('#modal-login-popup').content;

        document.querySelector('#content').addEventListener('click', function (event) {
            if (event.target.closest('.post-image')) {

                // the post image has been clicked
                // call the modal window with post properties

                var id = event.target.closest('.post').getAttribute('id');
                var curPost = controllerModule.getPostById(id);

                modalDiv.innerHTML = "";
                var modalPostNode = document.importNode(modalPostTemplate, true);

                fillPostTemplateWithData(modalPostNode, curPost);
                if (currentUserIx < 0 || curPost.user !== users[currentUserIx].name) {
                    modalPostNode.querySelector('.modal-post-delete').style.display = 'none';
                    modalPostNode.querySelector('.modal-post-edit').style.display = 'none';
                }

                modalDiv.style.display = 'block';

                modalPostNode.querySelector('.modal-post-edit').addEventListener('click', (event) => {
                    modalDiv.innerHTML = "";
                    var modalEditingNode = document.importNode(modalEditingTemplate, true);

                    editingHashtagsDiv  = modalEditingNode.querySelector('.editing-hashtags');
                    editingHashtagsDiv.addEventListener('keyup', onEditingHashtagInputKeyUp);
                    editingHashtagsDiv.addEventListener('focusout', onEditingHashtagInputFocusOut);
                    editingHashtagsDiv.addEventListener('click', onEditingHashtagRemoveButtonClick);

                    fillPostTemplateWithData(modalEditingNode, curPost);

                    modalEditingNode.querySelector('.modal-editing-save').addEventListener('click', ()=>{

                        modalDiv.style.display = 'none';
                        loadFirstPartOfThePosts();
                    });

                    modalEditingNode.querySelector('.modal-editing-discard').addEventListener('click', ()=>{
                        modalDiv.style.display = 'none';
                    });

                    modalDiv.appendChild(modalEditingNode);
                });

                modalPostNode.querySelector('.modal-post-delete', (event) => {

                });

                modalDiv.appendChild(modalPostNode);

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

                if (ix > -1) {
                    setCurrentUserByIndex(ix);
                    modalDiv.style.display = 'none';
                }
                else {
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

        filterHashtagsDiv.addEventListener('keyup', onFilterHashtagInputKeyUp);

        filterHashtagsDiv.addEventListener('focusout', onFilterHashtagInputFocusOut);

        filterHashtagsDiv.addEventListener('click', onFilterHashtagRemoveButtonClick);

        // ------- commands on document load ---------

        init();

    });

    function fillPostTemplateWithData(postNode, postObject) {
        postNode.querySelector(".post-image").querySelector('img').setAttribute('src', postObject.photoLink);

        postNode.querySelector(".post-user").innerText = postObject.user;
        postNode.querySelector(".post-date").innerText = postObject.createdAt.getDate() + '/' +
            (postObject.createdAt.getMonth() + 1) + "/" + postObject.createdAt.getFullYear();

        var descriptionDiv = postNode.querySelector('.post-description');
        if (descriptionDiv) {
            postNode.querySelector('.post-description').innerText = postObject.description;
        }

        var hashtagsDivNode = postNode.querySelector(".post-hashtags");
        if (hashtagsDivNode) {
            var hashtags = "";
            postObject.hashtags.forEach(function (tag, index, arr) {
                hashtags += "#" + tag;
                if (index < arr.length - 1) {
                    hashtags += " ";
                }
            });
            hashtagsDivNode.innerText = hashtags;
        }


        var likesDiv = postNode.querySelector('.post-likes');
        if (likesDiv) {
            // checks if current user has liked the post
            var isLikedByCurrentUser = currentUserIx > -1 && (postObject.likesFrom.indexOf(users[currentUserIx].name) >= 0);
            likesDiv.querySelector('img').setAttribute('src', (isLikedByCurrentUser) ?
                'icons/heart_full_32.png' : 'icons/heart_empty_32.png');
            likesDiv.querySelector('span').innerText = postObject.likesFrom.length;
        }

        // for editing post
        var descriptionInput = postNode.querySelector('#editing-description');
        if (descriptionInput) {
            descriptionInput.value = postObject.description;
        }

        var editingHashtags = postNode.querySelector('.editing-hashtags');
        if (editingHashtags) {
            postObject.hashtags.forEach(function (tag, index, arr) {
                editingHashtags.lastElementChild.querySelector('.hashtag-input').value = tag;
                editingHashtags.lastElementChild.querySelector('.hashtag-remove-button').style.display = 'block';
                addNewHashtagBlock(editingHashtagsDiv);
            });
        }
    }

    function setCurrentUserByIndex(index) {
        currentUserIx = index;
        var navButtons = document.querySelector('.header-nav');

        if (currentUserIx > -1) {
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
        for (var i = 0; i < content.childElementCount; i++) {
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
            fillPostTemplateWithData(postNode, curPost);

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
            fillPostTemplateWithData(postNode, curPost);

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

    // filter hashtags event listeners

    function onFilterHashtagInputKeyUp(event) {
        var hashtagBlock = event.target.closest('.hashtag-block');

        if (hashtagBlock.nextElementSibling === null) {
            if (event.target.value) {
                // the string is not empty
                addNewHashtagBlock(filterHashtagsDiv);
                event.target.parentElement.querySelector('.hashtag-remove-button').style.display = 'block';
            }
        }
    }

    function onFilterHashtagInputFocusOut(event) {
        if (event.target.tagName.toLowerCase() === 'input') {
            if (!event.target.value) {
                // the string in hashtag input is empty. should remove that block
                var hashtagBlock = event.target.closest('.hashtag-block');
                removeHashtagBlock(hashtagBlock, filterHashtagsDiv);
            }
        }
    }

    function onFilterHashtagRemoveButtonClick(event) {
        if (event.target.tagName.toLowerCase() === 'button') {
            var hashtagBlock = event.target.closest('.hashtag-block');
            removeHashtagBlock(hashtagBlock, filterHashtagsDiv);
        }
    }

    // editing post modal window hashtags event listeners

    function onEditingHashtagInputKeyUp(event) {
        var hashtagBlock = event.target.closest('.hashtag-block');

        if (hashtagBlock.nextElementSibling === null) {
            if (event.target.value) {
                // the string is not empty
                addNewHashtagBlock(editingHashtagsDiv);
                event.target.parentElement.querySelector('.hashtag-remove-button').style.display = 'block';
            }
        }
    }

    function onEditingHashtagInputFocusOut(event) {
        if (event.target.tagName.toLowerCase() === 'input') {
            if (!event.target.value) {
                // the string in hashtag input is empty. should remove that block
                var hashtagBlock = event.target.closest('.hashtag-block');
                removeHashtagBlock(hashtagBlock, editingHashtagsDiv);
            }
        }
    }

    function onEditingHashtagRemoveButtonClick(event) {
        if (event.target.tagName.toLowerCase() === 'button') {
            var hashtagBlock = event.target.closest('.hashtag-block');
            removeHashtagBlock(hashtagBlock, editingHashtagsDiv);
        }
    }

    function addNewHashtagBlock(curHashtagDiv) {
        var newHashtagBlock = document.importNode(hashtagBlockTemplate, true);
        newHashtagBlock.querySelector('.hashtag-remove-button').style.display = 'none';
        curHashtagDiv.appendChild(newHashtagBlock);
    }

    function removeHashtagBlock(hashtagBlock, curHashtagDiv) {
        if (curHashtagDiv.childElementCount > 1 ) {
            // if current hashtag block is not the only one and not the last one
            curHashtagDiv.removeChild(hashtagBlock);
        }
    }

    function init() {

        content = document.getElementById('content');

        setCurrentUserByIndex(1);
        setFilterConfig(null);
        fillUserSelectWithOptions();
        loadFirstPartOfThePosts();

    }

}();
