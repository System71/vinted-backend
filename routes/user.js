require("dotenv").config();

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

//SIGNUP
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const password = req.body.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);

    const { username, email, newsletter } = req.body;

    //Vérification si le username est renseigné

    if (!username) {
      return res.status(400).json({ message: "Username is missing" });
    }

    //Vérification si adresse mail unique

    const checkMail = await User.findOne({ email: email });

    if (checkMail) {
      return res.status(400).json({ message: "Email already used" });
    }

    const newUser = new User({
      email: email,
      account: {
        username: username,
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    //Export avatar vers cloudinary
    if (req.files) {
      const avatarToUpload = req.files.picture;

      const avatar = await cloudinary.uploader.upload(
        convertToBase64(avatarToUpload),
        { public_id: `vinted/avatar/${newUser.id}`, overwrite: true }
      );

      newUser.account.avatar = avatar;
    }

    await newUser.save();

    res.status(200).json({
      _id: newUser.id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//LOGIN
router.post("/user/login", async (req, res) => {
  try {
    const userToSearch = await User.findOne({ email: req.body.email });

    if (!userToSearch) {
      return res.status(401).json({ message: "Email or pasword invalid" });
    }

    const password = req.body.password;
    const salt = userToSearch.salt;
    const hash = SHA256(password + salt).toString(encBase64);
    const userHash = userToSearch.hash;

    if (hash !== userHash) {
      return res.status(401).json({ message: "Email or pasword invalid" });
    }

    res.status(200).json({
      _id: userToSearch.id,
      token: userToSearch.token,
      account: {
        username: userToSearch.account.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
