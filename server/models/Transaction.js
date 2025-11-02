import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  planId: {type: String, required: true},
  amount: {type: Number, required: true},
  credits: {type: Number, default: 0},
  isPaid: {type: Boolean, default: false},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now},
});


const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;