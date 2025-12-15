import { User } from '../models';

//get all users
export const getAllUsers = async () => {
  const data = await User.find();
  return data;
};

//create new user
export const newUser = async (body) => {
  const data = await User.create(body);
  return data;
};

//update single user
export const updateUser = async (_id, body) => {
  const data = await User.findByIdAndUpdate(
    {
      _id
    },
    body,
    {
      new: true
    }
  );
  return data;
};

//delete single user
export const deleteUser = async (id) => {
  await User.findByIdAndDelete(id);
  return '';
};

//get single user
export const getUser = async (id) => {
  const data = await User.findById(id);
  return data;
};

export const searchUsers = async (search, options = {}) => {
  const { page = 1, limit = 20 } = options;

  // If no search text → return empty array (or all users if you prefer)
  if (!search || !search.trim()) {
    return {
      data: [],
      total: 0,
      page,
      limit
    };
  }

  const regex = new RegExp(search.trim(), 'i'); // case-insensitive

  const filter = {
    $or: [
      { name: regex },
      { email: regex },
      { phoneNumber: regex } // or phone if your schema uses phone
    ]
  };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
    User.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit
  };
};
