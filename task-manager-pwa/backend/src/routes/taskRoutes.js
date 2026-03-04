const express = require('express');
const router = express.Router();

const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  syncTasks,
} = require('../controllers/taskController');

const { protect } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');
const {
  validate,
  createTaskSchema,
  updateTaskSchema,
} = require('../middlewares/validation');
const upload = require('../middlewares/upload');

// All task routes require authentication
router.use(protect);
router.use(apiLimiter);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', upload.single('file'), validate(createTaskSchema), createTask);
router.put('/:id', upload.single('file'), validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);
router.post('/sync', syncTasks);

module.exports = router;
