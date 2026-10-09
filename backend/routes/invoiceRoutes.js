const router = require('express').Router();
const { getAllInvoices, updateInvoice } = require('../controllers/invoiceController');

router.get('/', getAllInvoices);
router.put('/:id', updateInvoice);

module.exports = router;
