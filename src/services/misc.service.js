import { Flat, FlatMember, Society } from '../models';

export const usageMetric = async () => {
    const flatsCount = await Flat.countDocuments();
    const societyCount = await Society.countDocuments();
    const membersCount = await FlatMember.countDocuments();

    return { flatsCount, societyCount, membersCount };
}