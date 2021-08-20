import UserModel from "../src-shared/users.model";
import mongoose from "mongoose";


(async () => {
    mongoose.connect("mongodb+srv://Remi:TJQvAr9SnEDGU2D@cluster0.43i0s.mongodb.net/Thesis?retryWrites=true&w=majority", 
    {useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: true,
    useCreateIndex: true},
    ()=> console.log('connected to mongodb'));

    const users = [
        {id: 'kr82740',
            trials: [
                ['dummy',
                ['empty'],
                ['empty'],],
            ],
            consent: false,
            participantInfo: [
                 22,
            '2spirit',
            'neverland',
            'babylon',
            'triangle',
            [
                7,7,7,7,7
            ],
            'noob'
            ]}
    ]

    try {
        for (const user of users) {
          await UserModel.create(user);
          console.log(`Created user ${user.id} ${user.consent}`);
        }

        mongoose.disconnect()
        } catch (e) {
        console.error(e);
      }


})();