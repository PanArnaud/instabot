import { IgApiClient, MediaRepositoryLikersResponseUsersItem, LikeModuleInfoOption } from 'instagram-private-api';
import { config } from 'dotenv';

export default class BotService {
    ig: IgApiClient;
    user: string;
    password: string;
    accountToParse: string = 'lesbazarsdesev';
    usersToFollow: MediaRepositoryLikersResponseUsersItem[];

    constructor() {
        config();
        this.user = process.env.USERNAME;
        this.password = process.env.PASS;
        this.ig = new IgApiClient();
    }

    async run() {
        console.log('Gonna login.');
        await this.login();
        setInterval(async () => {
            if (!this.usersToFollow || this.usersToFollow.length < 1) {
                console.log('Ask for users to follow.')
                await this.getLatestPostLikers();
            } else {
                const user = this.usersToFollow.pop();
                console.log(`Get user ${user.username}.`);
                // await this.follow(user.pk);
                await this.likeLastPicture(user);
            }
        }, 60000);
    }

    async likeLastPicture(user: MediaRepositoryLikersResponseUsersItem) {
        const id = await this.ig.user.getIdByUsername(user.username);
        const feed = await this.ig.feed.user(id);
        const posts = await feed.items().catch((err) => {
            console.log(`Can't access to ${user.username}'s posts.`);
            return [];
        });
        if (posts.length > 0) {
            console.log(`Gonna like ${user.username}'s last picture.`)
            this.ig.media.like({
                mediaId: posts[0].id,
                d: 1,
                moduleInfo: { module_name: 'profile' } as LikeModuleInfoOption
            });

            const comment = this.getASentence();
            console.log(`Gonna comment '${comment}' on ${user.username}'s last picture.`)
            await this.ig.media.comment({ mediaId: posts[0].id, text: comment });
        }
    }

    async getLatestPostLikers() {
        const id = await this.ig.user.getIdByUsername(this.accountToParse);
        const feed = await this.ig.feed.user(id);
        const posts = await feed.items();
        this.usersToFollow = await (await this.ig.media.likers(posts[0].id)).users;
    }

    async follow(userId: number) {
        await this.ig.friendship.create(userId);
    }

    async login() {
        this.ig.state.generateDevice(this.user);
        await this.ig.simulate.preLoginFlow();
        const loggedInAccount = await this.ig.account.login(this.user, this.password);
        await this.ig.simulate.postLoginFlow();
        console.log(`Connected as ${loggedInAccount.full_name}`)
    }

    getASentence() {
        const sentences = [
            'Hey! Nice picture!',
            'Awesome!',
            'Nice! Cant wait to see more!',
            'Interesting!',
            'Cool!',
            'I like it!',
            'Nice work!',
            'Amazing work!',
            'Very nice picture!',
        ];

        return sentences[Math.floor(Math.random() * sentences.length)];
    }
}