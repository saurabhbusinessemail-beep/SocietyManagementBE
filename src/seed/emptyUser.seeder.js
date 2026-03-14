import { User } from '../models';

export async function getOrCreateDefaultUser() {
    try {
        const defaultPhone = '0000000000';

        let user = await User.findOne({ phoneNumber: defaultPhone });

        if (!user) {
            user = await User.create({
                name: 'Guest User',
                phoneNumber: defaultPhone,
                role: 'user',
                status: 'active',
                meta: { isGuest: true }
            });
            console.log('Default user created')
        } else {

            console.log('Default user exists')
        }

        return user;
    } catch (err) {
        console.error('Default user error:', err);
        throw err;
    }
}