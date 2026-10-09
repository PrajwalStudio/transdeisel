const router = require('express').Router();
const { getAllOrders, updateOrder } = require('../controllers/orderController');
const { validate, rejectUnknownFields } = require('../middleware/validation');
const { updateOrderRules } = require('../validators/orderValidators');

router.get('/', getAllOrders);
router.put(
	'/:id',
	rejectUnknownFields(['approval_status', 'completion_status', 'invoice_number', 'resolution_date']),
	updateOrderRules,
	validate,
	updateOrder
);

module.exports = router;
