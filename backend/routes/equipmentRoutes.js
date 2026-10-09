const router = require('express').Router();
const {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} = require('../controllers/equipmentController');
const { validate, rejectUnknownFields } = require('../middleware/validation');
const {
  equipmentIdParam,
  createEquipmentRules,
  updateEquipmentRules,
} = require('../validators/equipmentValidators');

const equipmentFields = [
  'equipment_no',
  'manufacturing_date',
  'warranty_status',
  'warranty_start_date',
  'warranty_end_date',
  'in_amc',
  'amc_start_date',
  'amc_end_date',
  'amc_location',
  'amc_amount',
  'po_number',
  'po_date',
  'engine_dgno',
  'engine_make',
  'engine_model',
  'kva_hp',
  'alternator_make',
  'alternator_sno',
  'alternator_model',
  'customer_name',
  'site_name',
  'address',
  'contact_person',
  'contact_number',
  'email',
];

const equipmentUpdateFields = equipmentFields.filter((f) => f !== 'equipment_no');

router.get('/', getAllEquipment);
router.get('/:id', equipmentIdParam, validate, getEquipmentById);
router.post(
  '/',
  rejectUnknownFields(equipmentFields),
  createEquipmentRules,
  validate,
  createEquipment
);
router.put(
  '/:id',
  rejectUnknownFields(equipmentUpdateFields),
  updateEquipmentRules,
  validate,
  updateEquipment
);
router.delete('/:id', equipmentIdParam, validate, deleteEquipment);

module.exports = router;

