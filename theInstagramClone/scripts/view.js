var viewModule = function () {

    document.addEventListener('DOMContentLoaded', function () {

        // ------- variables

        var hashtagBlockTemplate = document.getElementById('filter-hashtag-block').content;
        var filterHashtagsDiv = document.querySelector('.filter-hashtags');

        document.querySelector('.filter-apply').addEventListener('click', function () {
            var config = {};

            config.user = this.form.elements['filter-user'].value;
            if (this.form.elements['filter-user'].selectedIndex === 0){
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
            mainModule.setFilterConfig(config);
            mainModule.refreshPosts();
        });

        document.querySelector('.filter-clear').addEventListener('click', function () {
            mainModule.clearFilterFields();
            mainModule.refreshPosts();
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

        function addNewHashtagBlock() {
            var newHashtagBlock = document.importNode(hashtagBlockTemplate, true);
            newHashtagBlock.querySelector('.hashtag-remove-button').style.display = 'none';
            filterHashtagsDiv.appendChild(newHashtagBlock);
        }

        function removeHashtagBlock(hashtagBlock) {
            filterHashtagsDiv.removeChild(hashtagBlock);
        }

        // ------- commands

        mainModule.init();

    });

}();