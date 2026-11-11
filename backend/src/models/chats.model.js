import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    }],
    lastMessage: {
      text: String,
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
      },
      createdAt: Date,
      status: {
        type: String,
        enum: ["sent", "delivered", "seen"]
      }
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("chat", chatSchema);
