const express = require("express");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const { User, validate, validateCards,validateFavorite } = require("../models/users");
const { Card } = require("../models/card");
const auth = require("../middleware/auth");
const router = express.Router();

router.get("/cards", auth, async (req, res) => {
  const cards = await Card.find({ user_id: req.user._id });
  res.send(cards);
});

router.patch("/cards", auth, async (req, res) => {
  const { error } = validateCards(req.body);
  if (error) res.status(400).send(error.details[0].message);

  const cards = await getCards(req.body.cards);
  if (cards.length != req.body.cards.length)
    res.status(400).send("Card numbers don't match");

  let user = await User.findById(req.user._id);
  user.cards = req.body.cards;
  user = await user.save();
  res.send(user);
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/register", async (req, res) => {
  const { error } = validateFavorite(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(
    _.pick(req.body, ["name", "email", "password", "biz", "cards"])
  );
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();
  res.send(_.pick(user, ["_id", "name", "email"]));
});

router.patch("/favorite", auth, async (req, res) => {
  const { error } = validateFavorite(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let cardId = req.body.cardId;

  let user = await User.findById(req.user._id);
  const cardIndex = user.favoriteCards.indexOf(cardId);
  if (cardIndex == -1)
  {
    user.favoriteCards.push(cardId);
  } else {
    user.favoriteCards.splice(cardIndex, 1);
  }
  user = await user.save();
  res.send(user);
});

module.exports = router;
