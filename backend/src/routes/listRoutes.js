const express = require('express');
const router = express.Router();

const {
  getLists,
  createList,
  updateList,
  deleteList,
} = require('../controllers/listController');

const { protect } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');
const { validate, createListSchema, updateListSchema } = require('../middlewares/validation');

// All list routes require authentication
router.use(protect);
router.use(apiLimiter);

router.get('/', getLists);
router.post('/', validate(createListSchema), createList);
router.put('/:id', validate(updateListSchema), updateList);
router.delete('/:id', deleteList);

module.exports = router;
