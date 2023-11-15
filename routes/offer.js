const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

//Affichage et trie des annonces suivant certains critères
router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    const limit = 5;

    const filters = {};
    const sortFilter = {};

    if (title) {
      //Demander pour l'écrire avec le double //
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin) {
      filters.product_price = { $gt: priceMin };
    }
    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lt = priceMax;
      } else {
        filters.product_price = { $lt: priceMax };
      }
    }
    // A SECURISER AVEC DES VALEURS DE SORT PAS BONNES
    if (sort) {
      if (sort === "price-desc") {
        sortFilter.product_price = "desc";
      } else {
        sortFilter.product_price = "asc";
      }
    }

    const offers = await Offer.find(filters)
      .select("product_name product_price -_id")
      .sort(sortFilter)
      .limit(limit)
      .skip(page ? (page - 1) * limit : 0);
    res.status(201).json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Récupérer les détails d'une annonce en fonction de son id
router.get("/offer/:id", async (req, res) => {
  try {
    const offerToFind = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );

    res.status(201).json(offerToFind);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Créer une annonce
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, brand, size, condition, color, city } =
        req.body;

      if (title.length > 50) {
        return res
          .status(400)
          .json({ message: "Title limited to 50 characters" });
      }

      if (description.length > 500) {
        return res
          .status(400)
          .json({ message: "Description limited to 500 characters" });
      }

      if (price > 100000) {
        return res.status(400).json({ message: "Price limited to 100000" });
      }

      //Enregistrement de l'offre sur MongoDB
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ETAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],

        owner: req.user,
      });

      //Export photo vers cloudinary
      if (req.files) {
        const pictureToUpload = req.files.picture;

        const picture = await cloudinary.uploader.upload(
          convertToBase64(pictureToUpload),
          { public_id: `vinted/offers/${newOffer.id}`, overwrite: true }
        );

        newOffer.product_image = picture;
      }

      await newOffer.save();

      res.status(201).json(newOffer);
    } catch (error) {
      cccccccc;
    }
  }
);

//Modifier une annonce
router.put("/offer/modify", fileUpload(), async (req, res) => {
  try {
    const offerToFind = await Offer.findByIdAndUpdate(
      req.body.id,
      {
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          {
            MARQUE: req.body.brand,
          },
          {
            TAILLE: req.body.size,
          },
          {
            ETAT: req.body.condition,
          },
          {
            COULEUR: req.body.color,
          },
          {
            EMPLACEMENT: req.body.city,
          },
        ],
      },
      { new: true }
    );

    console.log(offerToFind);

    res.status(201).json({ message: "Annonce modifiée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Supprimer une annonce
router.delete("/offer/delete/:id", async (req, res) => {
  const offerToFind = await Offer.findByIdAndDelete(req.params.id);
  res.status(201).json({ message: "Annonce supprimée" });
});

module.exports = router;
