import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        //user Id from Clerk
        UID: { type: String, required: true, unique: true },
        //All group IDs the user is part of
        GID: { type: [String] },
        //user's stats and streaks
        stats: {
            time: Date,
            straks: Number,
            personalBest: Number,
        },
        //user's goals and progress
        Goals: { type: [String], progress: [Number] },
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;