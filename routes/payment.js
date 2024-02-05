const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

router.post("/payment", async (req, res) => {
  const stripeToken = req.body.token;
  const amount = req.body.amount * 100;
  const description = req.body.title;

  const response = await stripe.charges.create({
    amount: amount,
    currency: "eur",
    description: description,
    source: stripeToken,
  });
  console.log("response.status=", response.status);

  res.json(response);
});

module.exports = router;
