const mongoose = require('mongoose');

const configSchema = mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        description: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Config = mongoose.model('Config', configSchema);

module.exports = Config;
