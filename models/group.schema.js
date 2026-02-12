import mongoose from "mongoose";

const Schema = mongoose.Schema;

const groupSchema = new Schema(
    {
        //group name
        name: { type: String, required: true, unique: true },
        about: { type: String },
        //group icons
        icon: { type: String },
        color: { type: String },
        //admin user ID
        adminUID: { type: String, required: true },
        //User IDs of group members
        UID: { type: [String], required: true },
        //group's shared goals
        goals: { type: [String] },
        //group's chat history
        chat: { type: [{ senderUID: String, message: String, timestamp: Date }] },

    },
    { timestamps: true }
);

const Group = mongoose.model('Group', groupSchema);

export default Group;