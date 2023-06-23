const mongoose = require('mongoose');

const { recordSchema } = require('./record.model');

const datasetSchema = new mongoose.Schema({
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    records: [{ type: recordSchema }],
    import: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Import',
      required: false
    },
    sourceDatasetId: { type: mongoose.Schema.Types.String, index: true, required: false }
  });

exports.datasetSchema = datasetSchema;
exports.datasetModel = mongoose.model('Dataset', datasetSchema);
