const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  archived: { type: Boolean, default: false, index: true },
  feature: { type: mongoose.Schema.Types.ObjectId, ref: 'Feature', required: true },
  dataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true }
});

exports.recordSchema = recordSchema;
exports.recordModel = mongoose.model('Record', recordSchema);
