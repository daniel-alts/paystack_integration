
const mongoose = require('mongoose');
const shortid = require('shortid');

const Schema = mongoose.Schema;

const WalletSchema = new Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  created_at: { type: Date, default: new Date() },
  balance: { type: Number, required: 0 },
  email: { type: String, required: true },
});

const WalletModel = mongoose.model('wallet', WalletSchema);

module.exports = WalletModel;
