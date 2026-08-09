const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // (index on user is declared via schema.index below)
    userName: { type: String, trim: true },
    userRole: { type: String, trim: true },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    resource: { type: String, trim: true },
    resourceId: { type: String },
    description: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
