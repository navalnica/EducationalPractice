var dataModule = function () {

    var posts = [

        {
            id: '1',
            description: 'description 1',
            createdAt: new Date('2018-02-23T23:00:00'),
            author: 'author 1',
            photoLink: '/photos/photo1'
        },

        {
            id: '2',
            description: 'description 2',
            createdAt: new Date('2018-02-23T23:00:00'),
            author: 'author 1',
            photoLink: '/photos/photo1'
        },

        {
            id: '3',
            description: 'description 3',
            createdAt: new Date('2018-02-23T23:00:00'),
            author: 'author 1',
            photoLink: '/photos/photo1'
        },

        {
            id: '4',
            description: 'description 4',
            createdAt: new Date(),
            author: 'author 1',
            photoLink: '/photos/photo1'
        },

        {
            id: '5',
            description: 'description 5',
            createdAt: new Date('2018-02-23T23:00:00'),
            author: 'author 1',
            photoLink: '/photos/photo1'
        },

        {
            id: '6',
            description: 'description 6',
            createdAt: new Date('2018-02-23T23:00:00'),
            author: 'author 1',
            photoLink: '/photos/photo1'
        },

        {
            id: '7',
            description: 'description 7',
            createdAt: new Date('2018-02-23T23:00:00'),
            author: 'author 7',
            photoLink: '/photos/photo7'
        },

        {
            id: '8',
            description: 'description 8',
            createdAt: new Date('2018-02-23T23:00:00'),
            author: 'author 1',
            photoLink: 'link 8'
        },

        {
            id: '9',
            description: 'description 9',
            createdAt: new Date('2018-2-23T23:00:00'),
            author: 'author 9',
            photoLink: 'link 9'
        }

    ];

    return {
        posts: posts
    }

}();