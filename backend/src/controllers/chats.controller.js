import chatModel from "../models/chats.model.js";

export async function getUserChats(req, res) {
  try {
    const chats = await chatModel
      .find({ participants: req.user.id })
      .populate("participants", "username email")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ chats });
  } catch (error) {
    console.error("Error loading chats", error);
    res.status(500).json({ message: "Failed to load chats" });
  }
}
