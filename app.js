const express = require('express');
const axios = require('axios');
const db = require('./db');
const TransactionModel = require('./models/transaction');
const WalletModel = require('./models/wallet');


const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());

db.connect();

app.get('/', (req, res) => {
    res.send('Welcome To Paystack Integration, I see you');
})

// initialize transaction
app.post('/initiate_transaction', async (req, res) => {
    try {

  

    console.log(req.body);
    if (!req.body.amountInNaira || !req.body.email) {
        return res.status(400).json({
            message: 'Invalid request',
        });
    }

    // creating wallet if it doesn't exist
    let wallet = await WalletModel.findOne({ email: req.body.email });

    if (!wallet) {
        wallet = await WalletModel.create({
            balance: 0,
            email: req.body.email,
        });
    }

    const transaction = await TransactionModel.create({
        amount: req.body.amountInNaira,
        status: 'pending',
        type: 'credit',
        walletId: wallet._id,
    });

    const data = {
        amount: req.body.amountInNaira * 100,
        email: req.body.email,
        reference: transaction._id,
      };

    const headers = {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      };
    
      console.log(data);
      const response = await axios.post('https://api.paystack.co/transaction/initialize', 
      data, 
      {
        headers,
      });
    
      return res.json(response.data);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Something went wrong',
        });
    }
})

// success url
app.get('/paystack/success', async (req, res) => {
    return res.json({
        message: 'Transaction successful',
    });
})

// callback url
app.post('/paystack/callback', async (req, res) => {
    const body = req.body;
    const transaction = await TransactionModel.findOne({ _id: body.data.reference, status: 'pending' });
    console.log(req.body)

    if (!transaction) {
        console.log('Transaction not found');
        return res.status(404).json({
            message: 'Transaction not found',
        });
    }

    console.log('Transaction found', body.data.reference)

    // success
    if (body.event === 'charge.success') {
        

        const wallet = await WalletModel.findOne({ _id: transaction.walletId });
        wallet.balance = wallet.balance + transaction.amount;
        wallet.save();

        transaction.status = 'success';
        transaction.save();
    }

    // failed
    if (body.event === 'charge.failed') {
        transaction.status = 'failed';
        transaction.save();
    }

    return res.status(200).json({
        message: 'Callback received',
    });
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
