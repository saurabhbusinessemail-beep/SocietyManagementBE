import express from 'express';
import * as userController from '../controllers/user.controller';
import { userAuth } from '../middlewares/auth.middleware';

const router = express.Router();

//route to get all users
router.get('', userAuth, userController.getAllUsers);

//route to create a new user
router.post('', userAuth, userController.newUser);

//route to get a single user by their user id
router.get('/:_id', userAuth, userController.getUser);

//route to update a single user by their user id
router.put('/:_id', userAuth, userController.updateUser);

//route to update user name by their user id
router.patch('/updateName', userAuth, userController.updateName);

//route to update fcm token by their user id
router.patch('/updateFCMToken', userAuth, userController.updateFCMToken);

//route to delete a single user by their user id
router.delete('/:_id', userAuth, userController.deleteUser);

//route to search users by their name, phone or email
router.get('/search/:_searchText', userAuth, userController.searchUser);

export default router;
