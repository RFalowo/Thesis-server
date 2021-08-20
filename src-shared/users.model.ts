import pkg from 'mongoose';
const { model } = pkg;
import { IUserDocument } from "./api";
import userSchema from "./userSchema.js";
const UserModel = model<IUserDocument>("User-database", userSchema);
export default UserModel;