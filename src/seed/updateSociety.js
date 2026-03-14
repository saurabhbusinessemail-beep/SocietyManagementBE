import { Society } from '../models';

export async function updateSocietyRecords() {
    try {
        const result = await Society.updateMany(
            {
                isApproved: { $exists: false },
                addedByAdmin: { $exists: false }
            },
            {
                $set: { addedByAdmin: true }
            }
        );

        console.log('Modified:', result.modifiedCount);
        return result;
    } catch (err) {
        console.error(err);
        throw err;
    }
}