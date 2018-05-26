/* TODO:
   upload photos via multer
   add long polling
*/

let clientControllerModule = function () {

    const localStorageCurrentUserNameFieldName = 'currentUserName';

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

    let usersCollection = null; // contains only names of users
    let currentUserName = null;
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

            if (event.target.closest('.post-likes')) {
                const result = await likeEventListener(event);
            }

            if (event.target.closest('.post-image')) {
                // load modal window with full info about selected post

                const id = event.target.closest('.post').getAttribute('id');
                const xhrParams = {
                    id: id
                };
                const curPost = JSON.parse(await makeAsyncXmlHttpRequest(
                    'put', '/posts/getSinglePost', xhrParams));
                correctCreatedAtFieldInPostAfterJsonParse(curPost);

                modalDiv.innerHTML = "";
                let modalPostNode = document.importNode(modalPostTemplate, true);

                fillPostTemplateWithData(modalPostNode, curPost);
                modalPostNode.querySelector('.post').setAttribute('id', curPost.id);
                if (curPost.isEditable) {
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

                            let form = document.querySelector('#editing-form');
                            let editedPostData = {};

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
                                    resetNumberOfVisiblePosts();
                                    requestAndLoadFilteredPostsFromServerAsynchronously();
                                })
                                .catch(function (err) {
                                    console.error(`error while processing xhr on /posts/edit`);
                                    console.error(`err: ${err}`);
                                });

                            debugger;
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
                                resetNumberOfVisiblePosts();
                                requestAndLoadFilteredPostsFromServerAsynchronously();
                            })
                            .catch(function (err) {
                                console.error(`error while processing xhr on /posts/delete`);
                                console.error(`err: ${err}`);
                            });
                    });
                }
                else {
                    modalPostNode.querySelector('.delete').style.display = 'none';
                    modalPostNode.querySelector('.edit').style.display = 'none';
                }

                modalPostNode.querySelector('.post-likes').addEventListener('click', async function (event) {
                    const likesData = await likeEventListener(event, true);
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
            newPostData.createdAt = new Date();
            modalCreatingNode.querySelector('.post-user').innerText = currentUserName;

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
                else {
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
                        resetNumberOfVisiblePosts();
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

                const xhrParams = {
                    name: name,
                    password: password
                };
                makeAsyncXmlHttpRequest('put', '/authenticate', xhrParams)
                    .then(function (response) {
                        console.log('xhr to /authenticate processed successfully');
                        console.log(`server responded with "${response}"`);
                        modalDiv.style.display = 'none';
                        currentUserName = name;
                        setCurrentUserNameToLocalStorage(name);
                        initializeInterfaceForUser();
                        resetNumberOfVisiblePosts();
                        requestAndLoadFilteredPostsFromServerAsynchronously();
                    })
                    .catch(function (err) {
                        console.error(`error while authenticating`);
                        console.error(`err: ${err}`);
                        document.querySelector('.authentication-failed-span').style.display = 'block';
                    });

            });
        });

        document.querySelector('#log-out').addEventListener('click', async () => {
            const response = await makeAsyncXmlHttpRequest('put', '/logout');
            console.log('log out server response: ', response);
            currentUserName = null;
            setCurrentUserNameToLocalStorage();
            initializeInterfaceForUser();
            resetNumberOfVisiblePosts();
            requestAndLoadFilteredPostsFromServerAsynchronously();
        });

        document.querySelector('#my-photos').addEventListener('click', () => {
            setFilterConfig({user: currentUserName});
            resetNumberOfVisiblePosts();
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
            resetNumberOfVisiblePosts();
            requestAndLoadFilteredPostsFromServerAsynchronously();
        });

        document.querySelector('.filter-clear').addEventListener('click', function () {
            clearFilterFields();
            resetNumberOfVisiblePosts();
            requestAndLoadFilteredPostsFromServerAsynchronously();
        });

        document.querySelector('.load-more-button').addEventListener('click', () => {
            requestAndLoadFilteredPostsFromServerAsynchronously();
        });

        document.querySelector('#siteTitle').addEventListener('click', event=>{
            clearFilterFields();
            resetNumberOfVisiblePosts();
            requestAndLoadFilteredPostsFromServerAsynchronously();
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
                const postsCollection = JSON.parse(response);
                postsCollection.forEach(post => correctCreatedAtFieldInPostAfterJsonParse(post));
                updatePostsContainer(postsCollection);
            })
            .catch(function (err) {
                console.error(`error while processing xhr on /getFilteredPosts`);
                console.error(`err: ${err}`);
            });
    }

    async function updateUsersListByAsynchronousRequestToServer() {
        const response = await makeAsyncXmlHttpRequest('GET', '/getUsersList');
        usersCollection = JSON.parse(response);
    }

    async function likeEventListener(event, updatePostInPostsContainer) {
        const id = event.target.closest('.post').getAttribute('id');
        const xhrParams = {
            id: id
        };
        const likesData = JSON.parse(await makeAsyncXmlHttpRequest('put', '/posts/addLike', xhrParams));
        setPostLikesInfo(event.target.closest('.post-likes'), likesData.icon, likesData.count);

        if (updatePostInPostsContainer) {
            const post = Array.prototype.find.call(content.children, postDiv => {
                return postDiv.getAttribute('id') === id;
            });
            setPostLikesInfo(post.querySelector('.post-likes'), likesData.icon, likesData.count);
        }
    }

    function correctCreatedAtFieldInPostAfterJsonParse(post) {
        const dateString = post.createdAt;
        post.createdAt = new Date(dateString);
    }

    /* -------------- end of server communication methods ------------------- */

    function loadCurrentUserNameFromLocalStorage() {
        currentUserName = localStorage.getItem(localStorageCurrentUserNameFieldName);
    }

    function setCurrentUserNameToLocalStorage() {
        if (!currentUserName) {
            localStorage.removeItem(localStorageCurrentUserNameFieldName);
        }
        else {
            localStorage.setItem(localStorageCurrentUserNameFieldName, currentUserName);
        }
    }

    function updatePostsContainer(postsCollection) {
        if (!postsCollection) {
            console.error('could not find postsCollection in localStorage');
            return false;
        }

        if (numberOfVisiblePosts === 0){
            content.innerHTML = "";
        }
        numberOfVisiblePosts += postsCollection.length;
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

    function fillPostTemplateWithData(postHTMLNode, postData) {
        postHTMLNode.querySelector(".post-image").querySelector('img').setAttribute('src', postData.photoLink);

        postHTMLNode.querySelector(".post-user").innerText = postData.user;
        let dateString = `${postData.createdAt.getDate()}/${(postData.createdAt.getMonth() + 1)}/${postData.createdAt.getFullYear()}`;
        postHTMLNode.querySelector(".post-date").innerText = dateString;

        let descriptionDiv = postHTMLNode.querySelector('.post-description');
        if (descriptionDiv) {
            postHTMLNode.querySelector('.post-description').innerText = postData.description;
        }

        let hashtagsDivNode = postHTMLNode.querySelector(".post-hashtags");
        if (hashtagsDivNode) {
            let hashtags = "";
            postData.hashtags.forEach(function (tag, index, arr) {
                hashtags += "#" + tag;
                if (index < arr.length - 1) {
                    hashtags += " ";
                }
            });
            hashtagsDivNode.innerText = hashtags;
        }


        let likesDiv = postHTMLNode.querySelector('.post-likes');
        if (likesDiv) {
            // checks if current user has liked the post
            likesDiv.querySelector('img').setAttribute('src', postData.pathToLikeIcon);
            likesDiv.querySelector('span').innerText = postData.likesFrom.length.toString();
        }

        // for editing post
        let descriptionInput = postHTMLNode.querySelector('#editing-description');
        if (descriptionInput) {
            descriptionInput.value = postData.description;
        }

        let editingHashtags = postHTMLNode.querySelector('.editing-hashtags');
        if (editingHashtags) {
            postData.hashtags.forEach(function (tag) {
                editingHashtagsDiv.lastElementChild.querySelector('.hashtag-input').value = tag;
                editingHashtagsDiv.lastElementChild.querySelector('.hashtag-remove-button').style.display = 'block';
                addNewHashtagBlock(editingHashtagsDiv);
            });
        }
    }

    function initializeInterfaceForUser() {
        let navButtons = document.querySelector('.header-nav');

        if (!currentUserName) {
            document.querySelector('.current-user-name').innerText = 'Guest';

            navButtons.querySelector('#my-photos').style.display = 'none';
            navButtons.querySelector('#upload-photo').style.display = 'none';
            navButtons.querySelector('#log-out').style.display = 'none';

            navButtons.querySelector('#log-in').style.display = 'block';
        }
        else {
            document.querySelector('.current-user-name').innerText = currentUserName;

            navButtons.querySelector('#my-photos').style.display = 'block';
            navButtons.querySelector('#upload-photo').style.display = 'block';
            navButtons.querySelector('#log-out').style.display = 'block';

            navButtons.querySelector('#log-in').style.display = 'none';
        }
    }

    function resetNumberOfVisiblePosts() {
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
        for (let i = 0; i < usersCollection.length; i++) {
            option = document.createElement("option");
            option.text = usersCollection[i];
            select.add(option);
        }
    }

    // ------------ functions to work with hashtags -------------------

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

    // ------------ end of hashtags functions ----------------

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

    function setPostLikesInfo(postLikesDiv, iconLink, likesCount) {
        let img = postLikesDiv.querySelector('.likes-image');
        let likesSpan = postLikesDiv.querySelector('.post-likes-number');
        img.setAttribute('src', iconLink);
        likesSpan.innerText = likesCount.toString();
    }

    async function init() {
        // TODO init directly in DOM.onload event listener
        content = document.getElementById('content');
        curHashtagDiv = filterHashtagsDiv;

        setFilterConfig(null);
        resetNumberOfVisiblePosts();
        requestAndLoadFilteredPostsFromServerAsynchronously();
        await updateUsersListByAsynchronousRequestToServer();
        fillUserSelectWithOptions();
        loadCurrentUserNameFromLocalStorage();
        initializeInterfaceForUser();
    }

}();
