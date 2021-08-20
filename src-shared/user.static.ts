import { IUserDocument, IUserModel } from "./api";

export default async function findOneOrCreate(
    this: IUserModel,
    id: string
  ): Promise<IUserDocument> {
    const record = await this.findOne({ id });
    if (record) {
      return record;
    } else {
      return this.create({ id });
    }
  }
