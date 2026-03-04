const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler');
const SystemConfig = require('../models/SystemConfig');

/** Cache config values for upload middleware */
let _uploadCfg = {
  maxSizeMB: 5,
  allowedTypes: ['application/pdf', 'image/png', 'image/jpeg'],
};

const MIME_MAP = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  csv: 'text/csv',
  zip: 'application/zip',
};

const refreshUploadConfig = async () => {
  try {
    const cfg = await SystemConfig.getConfig();
    _uploadCfg.maxSizeMB = cfg.maxUploadSizeMB || 5;
    if (Array.isArray(cfg.allowedFileTypes) && cfg.allowedFileTypes.length > 0) {
      _uploadCfg.allowedTypes = cfg.allowedFileTypes
        .map((ext) => MIME_MAP[ext.toLowerCase()] || null)
        .filter(Boolean);
    }
  } catch { /* use defaults */ }
};
refreshUploadConfig();
setInterval(refreshUploadConfig, 60_000);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (_uploadCfg.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type (${file.mimetype}). Allowed: ${_uploadCfg.allowedTypes.join(', ')}`,
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: () => _uploadCfg.maxSizeMB * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
