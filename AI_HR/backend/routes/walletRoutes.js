const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { getMyWallet } = require("../controllers/walletController");

const router = express.Router();
router.use(protect);
router.get("/my-wallet", getMyWallet);

module.exports = router;
