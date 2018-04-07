var dataModule = function () {

    var users = [ 'admin', 'koscia', 'pasa', 'arsieni' ];

    var postSchema = {
        id: {
            constructorName: 'String',
            minLength: 1,
            maxLength: 200
        },
        user: {
            constructorName: 'String',
            minLength: 1,
            maxLength: 200
        },
        description: {
            constructorName: 'String',
            minLength: 1,
            maxLength: 200
        },
        createdAt: {constructorName: 'Date'},
        photoLink: {
            constructorName: 'String',
            minLength: 1,
            maxLength: 1000
        },
        hashtags: {
            constructorName: 'Array',
            elementsConstructorName: 'String'
        },
        likesFrom: {
            constructorName: 'Array',
            elementsConstructorName: 'String'
        },
        active: {constructorName: 'Boolean'}
    };

    var posts = [

        {
            id: '1',
            user: 'arsieni',
            description: 'hope you enjoy reading those descriptions',
            createdAt: new Date('2018-03-20T23:00:00'),
            photoLink: 'photos/img5.jpeg',
            hashtags: ['rain', 'rest', 'sunset'],
            likesFrom: ['arsieni', 'koscia', 'admin', 'pasa'],
            active: true
        },

        {
            id: '2',
            user: 'pasa',
            description: 'some fancy descriptions',
            createdAt: new Date('2018-03-23T23:00:00'),
            photoLink: 'photos/img3.jpeg',
            hashtags: ['rain', 'nature', 'car', 'sunset', 'evening'],
            likesFrom: ['pasa'],
            active: true
        },

        {
            id: '3',
            user: 'arsieni',
            description: 'hope you enjoy reading those descriptions',
            createdAt: new Date('2018-03-20T23:00:00'),
            photoLink: 'photos/img1.jpeg',
            hashtags: ['nature', 'sunset', 'evening'],
            likesFrom: ['koscia', 'admin'],
            active: true
        },

        {
            id: '4',
            user: 'admin',
            description: 'some fancy descriptions',
            createdAt: new Date('2018-03-20T23:00:00'),
            photoLink: 'photos/img10.jpeg',
            hashtags: ['rest'],
            likesFrom: ['arsieni'],
            active: true
        },

        {
            id: '5',
            user: 'arsieni',
            description: 'hope you enjoy reading those descriptions',
            createdAt: new Date('2018-03-22T23:00:00'),
            photoLink: 'photos/img2.jpeg',
            hashtags: ['rest', 'rain', 'comfort'],
            likesFrom: ['admin'],
            active: true
        },

        {
            id: '6',
            user: 'koscia',
            description: 'another dummy descriptions',
            createdAt: new Date('2018-03-22T23:00:00'),
            photoLink: 'photos/img10.jpeg',
            hashtags: ['sunset'],
            likesFrom: ['arsieni', 'koscia', 'pasa'],
            active: true
        },

        {
            id: '7',
            user: 'koscia',
            description: 'some fancy descriptions',
            createdAt: new Date('2018-03-21T23:00:00'),
            photoLink: 'photos/img3.jpeg',
            hashtags: ['rain', 'car'],
            likesFrom: ['arsieni', 'koscia', 'admin', 'pasa'],
            active: true
        },

        {
            id: '8',
            user: 'arsieni',
            description: 'another dummy descriptions',
            createdAt: new Date('2018-03-20T23:00:00'),
            photoLink: 'photos/img11.jpeg',
            hashtags: ['rain', 'car', 'work', 'evening', 'comfort'],
            likesFrom: ['arsieni', 'koscia', 'admin', 'pasa'],
            active: true
        },

        {
            id: '9',
            user: 'admin',
            description: 'hope you enjoy reading those descriptions',
            createdAt: new Date('2018-03-20T23:00:00'),
            photoLink: 'photos/img9.jpeg',
            hashtags: ['rest', 'car', 'sunset', 'comfort'],
            likesFrom: ['arsieni', 'koscia', 'admin', 'pasa'],
            active: true
        },

        {
            id: '10',
            user: 'pasa',
            description: 'hope you enjoy reading those descriptions',
            createdAt: new Date('2018-03-22T23:00:00'),
            photoLink: 'photos/img5.jpeg',
            hashtags: ['rest', 'nature', 'evening'],
            likesFrom: ['arsieni', 'admin'],
            active: true
        },

        {
            id: '11',
            user: 'admin',
            description: 'hope you enjoy reading those descriptions',
            createdAt: new Date('2018-03-22T23:00:00'),
            photoLink: 'photos/img7.jpeg',
            hashtags: ['car'],
            likesFrom: ['arsieni', 'koscia', 'admin', 'pasa'],
            active: true
        },

        {
            id: '12',
            user: 'arsieni',
            description: 'hope you enjoy reading those descriptions',
            createdAt: new Date('2018-03-21T23:00:00'),
            photoLink: 'photos/img10.jpeg',
            hashtags: ['rest', 'rain'],
            likesFrom: ['arsieni', 'koscia'],
            active: true
        },

        {
            id: '13',
            user: 'koscia',
            description: 'another dummy descriptions',
            createdAt: new Date('2018-03-23T23:00:00'),
            photoLink: 'photos/img4.jpeg',
            hashtags: ['nature', 'car', 'work', 'evening'],
            likesFrom: ['koscia', 'admin', 'pasa'],
            active: true
        },

        {
            id: '14',
            user: 'arsieni',
            description: 'another dummy descriptions',
            createdAt: new Date('2018-03-20T23:00:00'),
            photoLink: 'photos/img9.jpeg',
            hashtags: ['rain', 'car', 'evening'],
            likesFrom: ['arsieni', 'koscia', 'admin', 'pasa'],
            active: true
        },

        {
            id: '15',
            user: 'koscia',
            description: 'another dummy descriptions',
            createdAt: new Date('2018-03-20T23:00:00'),
            photoLink: 'photos/img13.jpeg',
            hashtags: ['rain', 'evening'],
            likesFrom: ['arsieni', 'koscia', 'admin', 'pasa'],
            active: true
        },

        {
            id: '16',
            user: 'koscia',
            description: 'some fancy descriptions',
            createdAt: new Date('2018-03-23T23:00:00'),
            photoLink: 'photos/img7.jpeg',
            hashtags: ['rest', 'work'],
            likesFrom: ['arsieni', 'admin', 'pasa'],
            active: true
        },

        {
            id: '17',
            user: 'admin',
            description: 'another dummy descriptions',
            createdAt: new Date('2018-03-23T23:00:00'),
            photoLink: 'photos/img2.jpeg',
            hashtags: ['rain', 'car'],
            likesFrom: ['koscia', 'admin', 'pasa'],
            active: true
        },

        {
            id: '18',
            user: 'koscia',
            description: 'another dummy descriptions',
            createdAt: new Date('2018-09-23T23:00:00'),
            photoLink: 'photos/img11.jpeg',
            hashtags: ['rain', 'evening'],
            likesFrom: ['pasa'],
            active: true
        },

        {
            id: '19',
            user: 'pasa',
            description: 'some fancy descriptions',
            createdAt: new Date('2018-03-21T23:00:00'),
            photoLink: 'photos/img13.jpeg',
            hashtags: ['work', 'sunset'],
            likesFrom: ['arsieni', 'admin', 'pasa'],
            active: true
        },

        {
            id: '20',
            user: 'arsieni',
            description: 'some fancy descriptions',
            createdAt: new Date('2018-03-22T23:00:00'),
            photoLink: 'photos/img9.jpeg',
            hashtags: ['car', 'work'],
            likesFrom: ['admin', 'pasa'],
            active: true
        }


    ];

    return {
        users: users,
        postSchema: postSchema,
        posts: posts
    }

}();