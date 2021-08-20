import pkg from 'mongoose';
const { model } = pkg;
import { IEmailDocument } from './api';
import emailSchema from './emailSchema.js';
const EmailModel = model<IEmailDocument>("Email-database", emailSchema);
export default EmailModel