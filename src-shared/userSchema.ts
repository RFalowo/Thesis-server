//user:
//-userID
//-cookie?
// -trails[embedded or linked]
// -consent
// -participantInfo(embed or link?)
import mongoose from 'mongoose';
import findOneOrCreate from "./user.static.js";


const trialSchema = new mongoose.Schema({
    designerType: String,
    stim: [String],
    resp: [String],
    
});

const participantInfoSchema = new mongoose.Schema({
    age: Number,
    gender: String,
    country_childhood: String,
    country_current: String,
    musicianship: String,
    synth_familiarity:{
        piano: Number,
        timbre: Number,
        soundsynth: Number,
        freqfilters: Number,
        freqDomain: Number,
    },
    threedDesign_familiarity: String
    

});

const participantSchema = new mongoose.Schema({
    userID: String,
    trials: [trialSchema],
    consent: Boolean,
    participantInfo: participantInfoSchema
});

const userSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    participant: participantSchema
});

userSchema.statics.findOneOrCreate = findOneOrCreate;


//module.exports = mongoose.model('UserData', userSchema);
export default userSchema;