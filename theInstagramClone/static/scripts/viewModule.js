var viewModule = function () {

    var hashtagBlockTemplate = null;
    var modalPostTemplate = null;
    var modalEditingTemplate = null;
    var modalCreatingTemplate = null;
    var modalLoginPopup = null;
    var filterHashtagsDiv = null;
    var editingHashtagsDiv = null;
    var creatingHashtagDiv = null;
    var modalDiv = null;
    var content = null;
    var curHashtagDiv = null;

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
        modalCreatingTemplate = document.querySelector('#modal-creating').content;
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
                    modalPostNode.querySelector('.delete').style.display = 'none';
                    modalPostNode.querySelector('.edit').style.display = 'none';
                }

                modalPostNode.querySelector('.edit').addEventListener('click', (event) => {
                    modalDiv.innerHTML = "";

                    var modalEditingNode = document.importNode(modalEditingTemplate, true);

                    editingHashtagsDiv = modalEditingNode.querySelector('.editing-hashtags');
                    editingHashtagsDiv.addEventListener('keyup', onHashtagInputKeyUp);
                    editingHashtagsDiv.addEventListener('focusout', onHashtagInputFocusOut);
                    editingHashtagsDiv.addEventListener('click', onHashtagRemoveButtonClick);

                    curHashtagDiv = editingHashtagsDiv;

                    fillPostTemplateWithData(modalEditingNode, curPost);

                    modalEditingNode.querySelector('#editing-image-file').addEventListener('change', checkSelectedImageFile);

                    modalEditingNode.querySelector('.save').addEventListener('click', () => {

                        var editedPost = {};

                        var form = document.querySelector('#editing-form');

                        editedPost.description = form.elements['description'].value;
                        if (!editedPost.description){
                            var errorSpan = document.querySelector('.error-span');
                            errorSpan.innerText = 'Description is required';
                            errorSpan.style.display = 'block';
                            return;
                        }

                        editedPost.hashtags = [];
                        var hashtags = form.elements['hashtag'];
                        for (var i = 0; i < hashtags.length; i++) {
                            if (hashtags[i].value) {
                                editedPost.hashtags.push(hashtags[i].value);
                            }
                        }

                        var files = form.elements['image-file'].files;
                        if (files.length === 1) {
                            editedPost.photoLink = 'photos/' + files[0].name;
                        }

                        // save changes
                        var success = controllerModule.editPost(curPost.id, editedPost);

                        modalDiv.style.display = 'none';
                        loadFirstPartOfThePosts();
                        curHashtagDiv = filterHashtagsDiv;
                    });

                    modalEditingNode.querySelector('.discard').addEventListener('click', () => {
                        modalDiv.style.display = 'none';
                        curHashtagDiv = filterHashtagsDiv;
                    });

                    modalDiv.appendChild(modalEditingNode);
                });

                modalPostNode.querySelector('.delete').addEventListener('click', (event) => {
                    modalDiv.style.display = 'none';
                    controllerModule.removePost(curPost.id);
                    loadFirstPartOfThePosts();
                });

                modalDiv.style.display = 'block';
                modalDiv.appendChild(modalPostNode);

            }
        });

        document.querySelector('#upload-photo').addEventListener('click', () => {
            modalDiv.innerHTML = "";
            var modalCreatingNode = document.importNode(modalCreatingTemplate, true);

            creatingHashtagDiv = modalCreatingNode.querySelector('.creating-hashtags');
            curHashtagDiv = creatingHashtagDiv;

            creatingHashtagDiv.addEventListener('keyup', onHashtagInputKeyUp);
            creatingHashtagDiv.addEventListener('focusout', onHashtagInputFocusOut);
            creatingHashtagDiv.addEventListener('click', onHashtagRemoveButtonClick);

            modalCreatingNode.querySelector('#creating-image-file').addEventListener('change', checkSelectedImageFile);

            var newPost = {};
            newPost.user = users[currentUserIx].name;
            newPost.createdAt = new Date();

            modalCreatingNode.querySelector('.post-user').innerText = newPost.user;
            var dateString = `${newPost.createdAt.getDate()}/${(newPost.createdAt.getMonth() + 1)}/${newPost.createdAt.getFullYear()}`;
            modalCreatingNode.querySelector('.post-date').innerText = dateString;

            modalCreatingNode.querySelector('.save').addEventListener('click', () => {

                var form = document.querySelector('#creating-form');

                newPost.description = form.elements['description'].value;

                if (!newPost.description){
                    var errorSpan = document.querySelector('.error-span');
                    errorSpan.innerText = 'Description is required';
                    errorSpan.style.display = 'block';
                    return;
                }

                newPost.hashtags = [];
                var hashtags = form.elements['hashtag'];
                for (var i = 0; i < hashtags.length; i++) {
                    if (hashtags[i].value) {
                        newPost.hashtags.push(hashtags[i].value);
                    }
                }

                var files = form.elements['image-file'].files;
                if (files.length === 1){
                    newPost.photoLink = 'photos/' + files[0].name;
                }

                // save changes
                var success = controllerModule.addPost(newPost);

                modalDiv.style.display = 'none';
                loadFirstPartOfThePosts();

                curHashtagDiv = filterHashtagsDiv;
            });

            modalCreatingNode.querySelector('.discard').addEventListener('click', () => {
                modalDiv.style.display = 'none';
                curHashtagDiv = filterHashtagsDiv;
            });

            modalDiv.style.display = 'block';
            modalDiv.appendChild(modalCreatingNode);
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
                curHashtagDiv = filterHashtagsDiv;
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
            var hashtags = this.form.elements['hashtag'];
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

        filterHashtagsDiv.addEventListener('keyup', onHashtagInputKeyUp);

        filterHashtagsDiv.addEventListener('focusout', onHashtagInputFocusOut);

        filterHashtagsDiv.addEventListener('click', onHashtagRemoveButtonClick);

        // ------- commands on document load ---------

        init();

    });

    function fillPostTemplateWithData(postNode, postObject) {
        postNode.querySelector(".post-image").querySelector('img').setAttribute('src', postObject.photoLink);

        postNode.querySelector(".post-user").innerText = postObject.user;
        var dateString = `${postObject.createdAt.getDate()}/${(postObject.createdAt.getMonth() + 1)}/${postObject.createdAt.getFullYear()}`;
        postNode.querySelector(".post-date").innerText = dateString;

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
                editingHashtagsDiv.lastElementChild.querySelector('.hashtag-input').value = tag;
                editingHashtagsDiv.lastElementChild.querySelector('.hashtag-remove-button').style.display = 'block';
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

    function onHashtagInputKeyUp(event) {
        var hashtagBlock = event.target.closest('.hashtag-block');

        if (hashtagBlock.nextElementSibling === null) {
            if (event.target.value) {
                // the string is not empty
                addNewHashtagBlock(curHashtagDiv);
                event.target.parentElement.querySelector('.hashtag-remove-button').style.display = 'block';
            }
        }
    }

    function onHashtagInputFocusOut(event) {
        if (event.target.tagName.toLowerCase() === 'input') {
            if (!event.target.value) {
                // the string in hashtag input is empty. should remove that block
                var hashtagBlock = event.target.closest('.hashtag-block');
                removeHashtagBlock(hashtagBlock, curHashtagDiv);
            }
        }
    }

    function onHashtagRemoveButtonClick(event) {
        if (event.target.tagName.toLowerCase() === 'button') {
            var hashtagBlock = event.target.closest('.hashtag-block');
            removeHashtagBlock(hashtagBlock, curHashtagDiv);
        }
    }

    // common hashtags functions

    function addNewHashtagBlock(curHashtagDiv) {
        var newHashtagBlock = document.importNode(hashtagBlockTemplate, true);
        newHashtagBlock.querySelector('.hashtag-remove-button').style.display = 'none';
        curHashtagDiv.appendChild(newHashtagBlock);
    }

    function removeHashtagBlock(hashtagBlock, curHashtagDiv) {
        if (curHashtagDiv.childElementCount > 1) {
            // if current hashtag block is not the only one and not the last one
            curHashtagDiv.removeChild(hashtagBlock);
        }
    }

    function checkSelectedImageFile(event) {
        var file = event.target.files[0];

        var fileTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];

        var errorSpan = document.querySelector('.error-span');
        var btn = document.querySelector('.save');
        if (fileTypes.indexOf(file.type) > -1) {
            // correct file selected
            errorSpan.style.display = 'none';
            document.querySelector('.image-preview').setAttribute('src', "photos/" + file.name);
            btn.disabled = false;
        }
        else {
            // inform user about wrong file type
            errorSpan.style.display = 'block';
            errorSpan.innerText = 'Only *.jpg, *.jpeg, *.png files are allowed';
            btn.disabled = true;
        }
    }

    function init() {

        content = document.getElementById('content');
        curHashtagDiv = filterHashtagsDiv;

        setCurrentUserByIndex(1);
        setFilterConfig(null);
        fillUserSelectWithOptions();
        loadFirstPartOfThePosts();

    }

}();
