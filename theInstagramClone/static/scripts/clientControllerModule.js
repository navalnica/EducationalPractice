/* TODO:
   get rid of 'saveChangesInPostsToLocalStorage'
   and 'controllerModule' usages
   figure out what to do with likes

   upload photos via multer

   add long polling
*/

let clientControllerModule = function () {

    const localStoragePostsCollectionFieldname = 'postsCollection';

    let hashtagBlockTemplate = null;
    let modalPostTemplate = null;
    let modalEditingTemplate = null;
    let modalCreatingTemplate = null;
    let modalLoginPopup = null;
    let filterHashtagsDiv = null;
    let editingHashtagsDiv = null;
    let creatingHashtagDiv = null;
    let modalDiv = null;
    let content = null;
    let curHashtagDiv = null;

    let users = null; // TODO: rename to 'usersList'
    let filterConfig = null;

    let numberOfVisiblePosts = 0;
    let numberOfPostsToLoad = 10;

    document.addEventListener('DOMContentLoaded', async function () {

        filterHashtagsDiv = document.querySelector('.filter-hashtags');
        hashtagBlockTemplate = document.querySelector('#filter-hashtag-block').content;
        modalDiv = document.querySelector('.modal-container');
        modalPostTemplate = document.querySelector('#modal-post').content;
        modalEditingTemplate = document.querySelector('#modal-editing').content;
        modalCreatingTemplate = document.querySelector('#modal-creating').content;
        modalLoginPopup = document.querySelector('#modal-login-popup').content;

        document.querySelector('#content').addEventListener('click', async function (event) {

            let id;
            let curPost;
            let currentUserIx;

            if (event.target.closest('.post-likes')) {

                id = event.target.closest('.post').getAttribute('id');
                curPost = getSinglePostByIdFromLocalStorage(id);
                currentUserIx = localStorage.getItem('currentUserIx') || -1;

                if (currentUserIx > -1) {
                    let userName = users[currentUserIx].name;
                    let indexInLikesArray = curPost.likesFrom.indexOf(userName);

                    if (indexInLikesArray === -1) {
                        curPost.likesFrom.push(userName);
                        setPostLikeStatus(event.target.closest('.post-likes'), true);
                    }
                    else {
                        curPost.likesFrom.splice(indexInLikesArray, 1);
                        setPostLikeStatus(event.target.closest('.post-likes'), false);
                    }
                    saveChangesInPostsToLocalStorage();
                }
            }

            if (event.target.closest('.post-image')) {

                id = event.target.closest('.post').getAttribute('id');
                currentUserIx = localStorage.getItem('currentUserIx') || -1;

                // make xhr to the server and pause function execution
                try{
                    curPost = await requestSinglePostFromServerAsynchronously(id);
                }
                catch(error){
                    console.error('error occured while requesting for single post data');
                    console.error(`error: ${error}`);
                }

                modalDiv.innerHTML = "";
                let modalPostNode = document.importNode(modalPostTemplate, true);

                fillPostTemplateWithData(modalPostNode, curPost);
                if (currentUserIx < 0 || curPost.user !== users[currentUserIx].name) {
                    modalPostNode.querySelector('.delete').style.display = 'none';
                    modalPostNode.querySelector('.edit').style.display = 'none';
                }

                modalPostNode.querySelector('.edit').addEventListener('click', (event) => {
                    modalDiv.innerHTML = "";

                    let modalEditingNode = document.importNode(modalEditingTemplate, true);

                    editingHashtagsDiv = modalEditingNode.querySelector('.editing-hashtags');
                    editingHashtagsDiv.addEventListener('keyup', onHashtagInputKeyUp);
                    editingHashtagsDiv.addEventListener('focusout', onHashtagInputFocusOut);
                    editingHashtagsDiv.addEventListener('click', onHashtagRemoveButtonClick);

                    curHashtagDiv = editingHashtagsDiv;

                    fillPostTemplateWithData(modalEditingNode, curPost);

                    modalEditingNode.querySelector('#editing-image-file').addEventListener('change', checkSelectedImageFile);

                    modalEditingNode.querySelector('.save').addEventListener('click', () => {

                        let editedPostData = {};

                        let form = document.querySelector('#editing-form');

                        editedPostData.description = form.elements['description'].value;
                        if (!editedPostData.description) {
                            let errorSpan = document.querySelector('.error-span');
                            errorSpan.innerText = 'Description is required';
                            errorSpan.style.display = 'block';
                            return;
                        }

                        editedPostData.hashtags = [];
                        let hashtags = form.elements['hashtag'];
                        for (let i = 0; i < hashtags.length; i++) {
                            if (hashtags[i].value) {
                                editedPostData.hashtags.push(hashtags[i].value);
                            }
                        }

                        let files = form.elements['image-file'].files;
                        if (files.length === 1) {
                            editedPostData.photoLink = 'photos/' + files[0].name;
                        }

                        // send xhr on edit
                        const xhrParams = {
                            id: curPost.id,
                            newData: editedPostData
                        };

                        makeAsyncXmlHttpRequest('put', '/posts/edit', xhrParams)
                            .then(function (response) {
                                console.log('xhr to /posts/edit processed successfully');
                                console.log(`server responded with "${response}"`);
                                resetPaginationOptions();
                                requestAndLoadFilteredPostsFromServerAsynchronously();
                            })
                            .catch(function (err) {
                                console.error(`error while processing xhr on /posts/edit`);
                                console.error(`err: ${err}`);
                            });

                        modalDiv.style.display = 'none';
                        curHashtagDiv = filterHashtagsDiv;
                    });

                    modalEditingNode.querySelector('.discard').addEventListener('click', () => {
                        modalDiv.style.display = 'none';
                        curHashtagDiv = filterHashtagsDiv;
                    });

                    modalDiv.appendChild(modalEditingNode);
                });

                modalPostNode.querySelector('.delete').addEventListener('click', () => {

                    modalDiv.style.display = 'none';

                    // send xhr on deletion
                    const xhrParams = {
                        id: id
                    };

                    makeAsyncXmlHttpRequest('put', '/posts/delete', xhrParams)
                        .then(function (response) {
                            console.log('xhr to /posts/delete processed successfully');
                            console.log(`server responded with "${response}"`);
                            resetPaginationOptions();
                            requestAndLoadFilteredPostsFromServerAsynchronously();
                        })
                        .catch(function (err) {
                            console.error(`error while processing xhr on /posts/delete`);
                            console.error(`err: ${err}`);
                        });
                });

                modalPostNode.querySelector('.post-likes').addEventListener('click', (event) => {

                    let currentUserIx = localStorage.getItem('currentUserIx') || -1;
                    if (currentUserIx > -1) {
                        let userName = users[currentUserIx].name;
                        let indexInLikesArray = curPost.likesFrom.indexOf(userName);

                        let postInFeed;
                        for (let i = 0; i < content.childElementCount; i++) {
                            if (content.children[i].id === id) {
                                postInFeed = content.children[i];
                                break;
                            }
                        }

                        if (indexInLikesArray === -1) {
                            curPost.likesFrom.push(userName);
                            setPostLikeStatus(event.currentTarget, true);
                            setPostLikeStatus(postInFeed, true);
                        }
                        else {
                            curPost.likesFrom.splice(indexInLikesArray, 1);
                            setPostLikeStatus(event.currentTarget, false);
                            setPostLikeStatus(postInFeed, false);
                        }
                        saveChangesInPostsToLocalStorage();
                    }

                });

                modalDiv.style.display = 'block';
                modalDiv.appendChild(modalPostNode);

            }
        });

        document.querySelector('#upload-photo').addEventListener('click', () => {
            modalDiv.innerHTML = "";
            let modalCreatingNode = document.importNode(modalCreatingTemplate, true);

            creatingHashtagDiv = modalCreatingNode.querySelector('.creating-hashtags');
            curHashtagDiv = creatingHashtagDiv;

            creatingHashtagDiv.addEventListener('keyup', onHashtagInputKeyUp);
            creatingHashtagDiv.addEventListener('focusout', onHashtagInputFocusOut);
            creatingHashtagDiv.addEventListener('click', onHashtagRemoveButtonClick);

            modalCreatingNode.querySelector('#creating-image-file')
                .addEventListener('change', checkSelectedImageFile);

            let newPostData = {};
            const currentUserIx = localStorage.getItem('currentUserIx') || -1;
            newPostData.user = users[currentUserIx].name;
            newPostData.createdAt = new Date();

            modalCreatingNode.querySelector('.post-user').innerText = newPostData.user;
            modalCreatingNode.querySelector('.post-date').innerText =
                `${newPostData.createdAt.getDate()}/${(newPostData.createdAt.getMonth() + 1)}/
                ${newPostData.createdAt.getFullYear()}`;

            modalCreatingNode.querySelector('.save').addEventListener('click', () => {

                const form = document.querySelector('#creating-form');
                newPostData.description = form.elements['description'].value;
                if (!newPostData.description) {
                    const errorSpan = document.querySelector('.error-span');
                    errorSpan.innerText = 'Description is required';
                    errorSpan.style.display = 'block';
                    return;
                }

                newPostData.hashtags = [];
                const hashtags = form.elements['hashtag'];
                for (let i = 0; i < hashtags.length; i++) {
                    if (hashtags[i].value) {
                        newPostData.hashtags.push(hashtags[i].value);
                    }
                }

                let files = form.elements['image-file'].files;
                if (files.length === 1) {
                    newPostData.photoLink = 'photos/' + files[0].name;
                }
                else{
                    // TODO: check
                    debugger;
                    return;
                }

                // save changes
                const xhrParams = {
                    newPostData: newPostData
                };
                makeAsyncXmlHttpRequest('put', '/posts/add', xhrParams)
                    .then(function (response) {
                        console.log('xhr to /posts/add processed successfully');
                        console.log(`server responded with "${response}"`);
                        resetPaginationOptions();
                        requestAndLoadFilteredPostsFromServerAsynchronously();
                    })
                    .catch(function (err) {
                        console.error(`error while processing xhr on /posts/add`);
                        console.error(`err: ${err}`);
                    });

                modalDiv.style.display = 'none';
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
            let loginPopupNode = document.importNode(modalLoginPopup, true);
            modalDiv.appendChild(loginPopupNode);
            modalDiv.style.display = 'block';

            this.querySelector('.login-form-submit').addEventListener('click', () => {
                let form = document.querySelector('#login-form');
                let name = form.elements['login-form-name'].value;
                let password = form.elements['login-form-password'].value;

                let ix = users.findIndex((element) => {
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
            resetPaginationOptions();
            requestAndLoadFilteredPostsFromServerAsynchronously();
        });

        document.querySelector('#my-photos').addEventListener('click', () => {
            const currentUserIx = localStorage.getItem('currentUserIx') || -1;
            setFilterConfig({user: users[currentUserIx].name});
            resetPaginationOptions();
            requestAndLoadFilteredPostsFromServerAsynchronously();
        });

        window.addEventListener('click', function (event) {
            if (event.target === modalDiv) {
                // hide the modal window
                modalDiv.style.display = 'none';
                curHashtagDiv = filterHashtagsDiv;
            }
        });

        document.querySelector('.filter-apply').addEventListener('click', function () {
            let config = {};

            config.user = this.form.elements['filter-user'].value;
            if (this.form.elements['filter-user'].selectedIndex === 0) {
                config.user = null;
            }

            let date = this.form.elements['filter-date'].value;
            if (date) {
                config.date = new Date(date);
            }

            config.hashtags = [];
            let hashtags = this.form.elements['hashtag'];
            for (let i = 0; i < hashtags.length; i++) {
                if (hashtags[i].value) {
                    config.hashtags.push(hashtags[i].value);
                }
            }

            setFilterConfig(config);
            resetPaginationOptions();
            requestAndLoadFilteredPostsFromServerAsynchronously();
        });

        document.querySelector('.filter-clear').addEventListener('click', function () {
            clearFilterFields();
            resetPaginationOptions();
            requestAndLoadFilteredPostsFromServerAsynchronously();
        });

        document.querySelector('.load-more-button').addEventListener('click', () => {
            // TODO pagination: load more
        });

        filterHashtagsDiv.addEventListener('keyup', onHashtagInputKeyUp);

        filterHashtagsDiv.addEventListener('focusout', onHashtagInputFocusOut);

        filterHashtagsDiv.addEventListener('click', onHashtagRemoveButtonClick);

        // ------- commands on document load ---------

        await init();

    });

    /* -------------- server communication methods ------------------- */
    async function makeAsyncXmlHttpRequest(method, url, params) {

        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();

            xhr.open(method, url);
            xhr.setRequestHeader('Content-type', 'application/json');

            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };

            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };

            xhr.send(JSON.stringify(params));
        });
    }

    function requestAndLoadFilteredPostsFromServerAsynchronously() {
        const xhrParams = {
            filterConfig: filterConfig,
            numOfPostsToSkip: numberOfVisiblePosts,
            numOfPostsToLoad: numberOfPostsToLoad
        };
        makeAsyncXmlHttpRequest('post', '/posts/getFilteredPosts', xhrParams)
            .then(function (response) {
                console.log('xhr to /getFilteredPosts processed successfully. posts loaded');
                updateLocalStoragePostsCollection(repsonse); // response in json format
                updatePostsContainer();
            })
            .catch(function (err) {
                console.error(`error while processing xhr on /getFilteredPosts`);
                console.error(`err: ${err}`);
            });
    }

    async function requestSinglePostFromServerAsynchronously(id) {
        const xhrParams = {
            id: id
        };

        const response = await makeAsyncXmlHttpRequest('put', '/posts/getSinglePost', xhrParams);
        let post = JSON.parse(response);
        correctCreatedAtFieldInPostAfterJsonParse(post);
        return post;
    }

    async function updateUsersListByAsynchronousRequestToServer(){
        const response = await makeAsyncXmlHttpRequest('GET', '/posts/getUsersList');
        users = JSON.parse(response);
    }

    /* -------------- end of server communication methods ------------------- */

    function correctCreatedAtFieldInPostAfterJsonParse(post) {
        const dateString = post.createdAt;
        post.createdAt = new Date(dateString);
    }

    function updateLocalStoragePostsCollection(postsCollectionJson){
        localStorage.setItem(localStoragePostsCollectionFieldname, postsCollectionJson);
    }

    function getPostsCollectionFromLocalStorage(){
        let postsJson = localStorage.getItem(localStoragePostsCollectionFieldname);
        let filteredPostsCollection = JSON.parse(postsJson);
        filteredPostsCollection.forEach((post) => correctCreatedAtFieldInPostAfterJsonParse(post));
        return filteredPostsCollection;
    }

    function getSinglePostByIdFromLocalStorage(id){
        const postsCollection = getPostsCollectionFromLocalStorage();
        const post = postsCollection.find((p)=>{
            return p.id === id;
        });
        debugger;
        return post;
    }

    function updatePostsContainer() {
        const postsCollection = getPostsCollectionFromLocalStorage();

        if (!postsCollection) {
            console.error('could not find postsCollection in localStorage');
            return false;
        }

        // clear current content of posts container
        numberOfVisiblePosts += postsCollection.length;
        content.innerHTML = "";
        let postTemplate = document.getElementById("post-template").content;

        for (let i = 0; i < postsCollection.length; i++) {
            let curPost = postsCollection[i];
            let postNode = document.importNode(postTemplate, true);
            postNode.querySelector('.post').setAttribute('id', curPost.id);
            fillPostTemplateWithData(postNode, curPost);
            content.appendChild(postNode);
        }

        return true;
    }

    function fillPostTemplateWithData(postNode, postObject) {
        postNode.querySelector(".post-image").querySelector('img').setAttribute('src', postObject.photoLink);

        postNode.querySelector(".post-user").innerText = postObject.user;
        let dateString = `${postObject.createdAt.getDate()}/${(postObject.createdAt.getMonth() + 1)}/${postObject.createdAt.getFullYear()}`;
        postNode.querySelector(".post-date").innerText = dateString;

        let descriptionDiv = postNode.querySelector('.post-description');
        if (descriptionDiv) {
            postNode.querySelector('.post-description').innerText = postObject.description;
        }

        let hashtagsDivNode = postNode.querySelector(".post-hashtags");
        if (hashtagsDivNode) {
            let hashtags = "";
            postObject.hashtags.forEach(function (tag, index, arr) {
                hashtags += "#" + tag;
                if (index < arr.length - 1) {
                    hashtags += " ";
                }
            });
            hashtagsDivNode.innerText = hashtags;
        }


        let likesDiv = postNode.querySelector('.post-likes');
        if (likesDiv) {
            // checks if current user has liked the post
            let currentUserIx = localStorage.getItem('currentUserIx') || -1;
            let isLikedByCurrentUser = currentUserIx > -1 && (postObject.likesFrom.indexOf(users[currentUserIx].name) >= 0);
            likesDiv.querySelector('img').setAttribute('src', (isLikedByCurrentUser) ?
                'icons/heart_full_32.png' : 'icons/heart_empty_32.png');
            likesDiv.querySelector('span').innerText = postObject.likesFrom.length;
        }

        // for editing post
        let descriptionInput = postNode.querySelector('#editing-description');
        if (descriptionInput) {
            descriptionInput.value = postObject.description;
        }

        let editingHashtags = postNode.querySelector('.editing-hashtags');
        if (editingHashtags) {
            postObject.hashtags.forEach(function (tag) {
                editingHashtagsDiv.lastElementChild.querySelector('.hashtag-input').value = tag;
                editingHashtagsDiv.lastElementChild.querySelector('.hashtag-remove-button').style.display = 'block';
                addNewHashtagBlock(editingHashtagsDiv);
            });
        }
    }

    function setCurrentUserByIndex(index) {
        localStorage.setItem('currentUserIx', index);
        let navButtons = document.querySelector('.header-nav');

        if (index > -1) {
            document.querySelector('.current-user-name').innerText = users[index].name;

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

        let content = document.querySelector('#content');
        for (let i = 0; i < content.childElementCount; i++) {
            let curId = content.children[i].getAttribute('id');
            let curPost = controllerModule.getPostById(curId);
            let isLikedByCurrentUser = index > -1 && (curPost.likesFrom.indexOf(users[index].name) >= 0);
            content.children[i].querySelector('.likes-image').setAttribute('src', (isLikedByCurrentUser) ?
                'icons/heart_full_32.png' : 'icons/heart_empty_32.png');
        }
    }

    function resetPaginationOptions() {
        numberOfVisiblePosts = 0;
    }

    function setFilterConfig(config) {
        filterConfig = config;
    }

    function clearFilterFields() {

        let filterForm = document.forms['filter-form'];
        filterForm.elements['filter-date'].value = null;
        filterForm.elements['filter-user'].selectedIndex = 0;

        let filterHashtagsDiv = document.querySelector('.filter-hashtags');
        while (filterHashtagsDiv.firstElementChild !== filterHashtagsDiv.lastElementChild) {
            filterHashtagsDiv.removeChild(filterHashtagsDiv.firstChild);
        }

        filterConfig = null;

    }

    function fillUserSelectWithOptions() {
        let select = document.querySelector('#filter-user');

        let option = document.createElement("option");
        option.text = 'all users';
        select.add(option);

        for (let i = 0; i < users.length; i++) {
            option = document.createElement("option");
            option.text = users[i].name;
            select.add(option);
        }
    }

    function onHashtagInputKeyUp(event) {
        let hashtagBlock = event.target.closest('.hashtag-block');

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
                let hashtagBlock = event.target.closest('.hashtag-block');
                removeHashtagBlock(hashtagBlock, curHashtagDiv);
            }
        }
    }

    function onHashtagRemoveButtonClick(event) {
        if (event.target.tagName.toLowerCase() === 'button') {
            let hashtagBlock = event.target.closest('.hashtag-block');
            removeHashtagBlock(hashtagBlock, curHashtagDiv);
        }
    }

    function addNewHashtagBlock(curHashtagDiv) {
        let newHashtagBlock = document.importNode(hashtagBlockTemplate, true);
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
        let file = event.target.files[0];

        let fileTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];

        let errorSpan = document.querySelector('.error-span');
        let btn = document.querySelector('.save');
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

    function setPostLikeStatus(postLikesDiv, isSet) {
        let img = postLikesDiv.querySelector('.likes-image');
        let likesSpan = postLikesDiv.querySelector('.post-likes-number');
        if (isSet) {
            img.setAttribute('src', 'icons/heart_full_32.png');
            likesSpan.innerText = (parseInt(likesSpan.innerText) + 1).toString();
        }
        else {
            img.setAttribute('src', 'icons/heart_empty_32.png');
            let prevCount = parseInt(likesSpan.innerText);
            if (prevCount > 1) {
                likesSpan.innerText = (prevCount - 1).toString();
            }
        }
    }

    async function init() {

        content = document.getElementById('content');
        curHashtagDiv = filterHashtagsDiv;

        setFilterConfig(null);
        resetPaginationOptions();
        requestAndLoadFilteredPostsFromServerAsynchronously();
        await updateUsersListByAsynchronousRequestToServer();
        fillUserSelectWithOptions();

        let currentUserIx = localStorage.getItem('currentUserIx');
        if (!currentUserIx) {
            localStorage.setItem('currentUserIx', 1);
            setCurrentUserByIndex(1);
        }
        else {
            setCurrentUserByIndex(currentUserIx);
        }

    }

}();
