import userModel from "../models/users.model.js";

export async function getUsers(req, res) {
  try {
    const users = await userModel
      .find({ _id: { $ne: req.user.id } })
      .select("username email")
      .lean();

    res.json({ users });
  } catch (error) {
    console.error("Error loading users", error);
    res.status(500).json({ message: "Failed to load users" });
  }
}
