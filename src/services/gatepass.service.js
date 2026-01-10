import { GatePass } from '../models';

export const createGatePass = (data) => {
  return GatePass.create({
    ...data,
    societyId: data.societyId
  });
};

export const getGatePasses = async (filter, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    GatePass.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdOn: -1 })
      .populate('societyId')
      .populate('flatId')
      .populate('userId'),
      GatePass.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

export const gettGatePass = async (id) => {
  const data = await GatePass.findById(id)
    .populate('societyId')
    .populate('flatId')
    .populate('userId');
  return data;
};

export const updateGatePass = async (_id, body) => {
  const data = await GatePass.findByIdAndUpdate({ _id }, body, { new: true });
  return data;
};

export const deleteGatePass = async (id) => {
  await GatePass.findByIdAndDelete(id);
  return '';
};
