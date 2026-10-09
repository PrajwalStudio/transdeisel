const router = require('express').Router();
const { getAllRequests, createRequest, updateRequest, deleteRequest } = require('../controllers/requestController');
const { validate, rejectUnknownFields } = require('../middleware/validation');
const { createRequestRules } = require('../validators/requestValidators');

router.get('/', getAllRequests);
router.post(
	'/',
	rejectUnknownFields([
		'equipment_no',
		'call_category',
		'pm_service_period',
		'visit_date',
		'running_hours',
		'symptom',
		'cause',
		'activity',
		'comments',
	]),
	createRequestRules,
	validate,
	createRequest
);

router.put(
	'/:id',
	rejectUnknownFields([
		'call_category',
		'pm_service_period',
		'visit_date',
		'running_hours',
		'symptom',
		'cause',
		'activity',
		'comments',
	]),
	updateRequest
);

router.delete('/:id', deleteRequest);

module.exports = router;
