const express = require('express');
const router = express.Router();

// Import your Mongoose models
import { Otp, User, FlatMember, GateEntry } from '../models';

// --------------------------------------------------------------
// Normalisation function: returns phone number in +91XXXXXXXXXX format
// --------------------------------------------------------------
const normalizeIndianPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return phone;

    // Remove all non-digit characters, but keep a leading '+' if present
    let cleaned = phone.trim();
    const hasPlus = cleaned.startsWith('+');
    const digits = cleaned.replace(/\D/g, '');

    // Only process if we have at least 10 digits (Indian mobile numbers)
    if (digits.length < 10) return phone;

    let normalized = null;

    if (digits.length === 10) {
        // Exactly 10 digits: add +91
        normalized = `+91${digits}`;
    } else if (digits.length === 11 && digits.startsWith('0')) {
        // 11 digits starting with 0: replace 0 with +91
        normalized = `+91${digits.slice(1)}`;
    } else if (digits.length === 12 && digits.startsWith('91')) {
        // 12 digits starting with 91: replace 91 with +91
        normalized = `+91${digits.slice(2)}`;
    } else if (hasPlus && digits.length === 12 && digits.startsWith('91')) {
        // Already has +, but maybe it's +91XXXXXXXXXX – keep as is
        normalized = phone;
    }

    // If we produced a new version, return it; otherwise keep original
    return normalized || phone;
}

export const NormaliseAllPhoneNumbers = async () => {

    const results = {
        Otp: { updated: 0, skipped: 0, error: null },
        User: { updated: 0, skipped: 0, error: null },
        FlatMember: { updated: 0, skipped: 0, error: null },
        GateEntry: { updated: 0, skipped: 0, error: null },
    };

    // Define which field to update per model
    const modelConfigs = [
        { model: Otp, field: 'phoneNumber' },
        { model: User, field: 'phoneNumber' },
        { model: FlatMember, field: 'contact' },
        { model: GateEntry, field: 'visitorContact' },
        // Add other models here, e.g. { model: Visitor, field: 'visitorContact' }
    ];

    for (const config of modelConfigs) {
        const { model, field } = config;
        const modelName = model.modelName;

        try {
            // Find all documents where the field exists and is a string
            const docs = await model.find({ [field]: { $type: 'string' } });

            let updates = [];

            for (const doc of docs) {
                const original = doc[field];
                const normalized = normalizeIndianPhone(original);

                if (normalized !== original) {
                    updates.push({
                        updateOne: {
                            filter: { _id: doc._id },
                            update: { $set: { [field]: normalized } },
                        },
                    });
                } else {
                    results[modelName].skipped++;
                }
            }

            // Perform bulk update if there are changes
            if (updates.length > 0) {
                const bulkResult = await model.bulkWrite(updates);
                results[modelName].updated = bulkResult.modifiedCount;
            } else {
                results[modelName].updated = 0;
            }

        } catch (err) {
            console.error(`Error updating ${modelName}:`, err);
            results[modelName].error = err.message;
        }
    }

    return results;
}