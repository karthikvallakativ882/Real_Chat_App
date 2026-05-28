import { UserModel } from "../models/UserModel.js";

export const getUsers = async (req, res) => {

  try {

    const users = await UserModel.find()
      .select("-password");

    res.status(200).json(users);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};