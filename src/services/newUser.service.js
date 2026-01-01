import { Flat, FlatMember } from '../models';

export const creatFlatMember = (data) => {
  return FlatMember.create(data);
};

export const updateFlatMember = async (flatId, flatMemberId) => {
  const flat = await Flat.findById(flatId);
  if (!flat) return;

  flat.flatMemberId = flatMemberId;
  await Flat.findByIdAndUpdate({ _id: flatId }, flat, { new: true });
};
