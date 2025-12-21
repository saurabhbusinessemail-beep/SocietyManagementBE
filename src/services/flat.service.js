import { Flat, FlatMember } from '../models';

export const createFlat = (data) => {
    return Flat.create({
        ...data,
        societyId: data.societyId,
        buildingId: data.buildingId || null
    });
}

export const bulkCreateFlats = ({ societyId, buildingId, flats }) => {
    return Flat.insertMany(
        flats.map(f => ({
            ...f,
            societyId,
            buildingId: buildingId || null
        }))
    );
}

export const getFlats = ({ societyId, buildingId }) => {
    let filter = { societyId };
    if (buildingId) filter['buildingId'] = buildingId;
    return Flat.find(filter);
}

export const myFlats = (userId) => {
    return FlatMember.find({
        userId: { $in: userId }
    });
}