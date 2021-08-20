import { Document, Model, Types } from "mongoose";

export type DesignerType = "3D" | "Sound" | "N/A";
export interface Trial {
  designerType: DesignerType;
  stim: string[];
  resp: string[];
}

interface Synthfamiliarity {
  piano: number;
  timbre: number;
  soundsynth: number;
  freqfilters: number;
  freqDomain: number;
}

export interface Player {
  userID: string;
  trials: Trial[];
  consent: boolean;
  participantInfo: {
    age: number;
    gender: string;
    country_childhood: string;
    country_current: string;
    musicianship: string;
    synth_familiarity: Synthfamiliarity;
    threedDesign_familiarity: number;
  };
}

export interface Email {
  Email: string;
}

export interface IEmailDocument extends Email, Document {}

export interface IEmailModel extends Model<IEmailDocument> {}

export interface IUserDocument extends Player, Document {
  id: string;
}
export interface IUserModel extends Model<IUserDocument> {
  findOneOrCreate: (
    this: IUserModel,
    {
      trials,
      consent,
      participantInfo,
    }: { trials: []; consent: boolean; participantInfo: [] }
  ) => Promise<IUserDocument>;
}
