const Coupon = require('../models/coupon.model');

// ---- Validation helpers (inside service) ----
export const validateCouponData = (couponData) => {
    const { code, type, value, planId, isActive } = couponData;

    if (!code || typeof code !== 'string') {
        throw new Error('Invalid coupone code');
    }
    if (!type || !['percentage', 'fixed', 'direct'].includes(type)) {
        throw new Error('Invalid coupon value');
    }
    if (typeof value !== 'number' || value < 0) {
        throw new Error('Value must be a non-negative number');
    }
    if (type === 'percentage' && (value < 0 || value > 100)) {
        throw new Error('Percentage value must be between 0 and 100');
    }
    if (planId !== undefined && planId !== null && typeof planId !== 'string') {
        throw new Error('planId must be a string or null');
    }
    if (isActive !== undefined && typeof isActive !== 'boolean') {
        throw new Error('isActive must be a boolean');
    }
};

// ---- CRUD Operations with validation ----
export const createCoupon = async (couponData) => {
    validateCouponData(couponData);
    const existing = await Coupon.findOne({ code: couponData.code.toUpperCase() });
    if (existing) {
        throw new Error('Coupon code already exists');
    }
    const coupon = new Coupon({
        ...couponData,
        code: couponData.code.toUpperCase(),
        planId: couponData.planId || null,   // ensure null if not provided
    });
    await coupon.save();
    return coupon;
};

export const getCouponByCode = async (code) => {
    return await Coupon.findOne({ code: code.toUpperCase() });
};

export const updateCoupon = async (code, updateData) => {
    // Validate only the fields being updated
    if (updateData.value !== undefined || updateData.type !== undefined || updateData.planId !== undefined) {
        const existingCoupon = await getCouponByCode(code);
        if (!existingCoupon) throw new Error('Coupon not found');
        const merged = { ...existingCoupon.toObject(), ...updateData };
        validateCouponData(merged);
    }
    return await Coupon.findOneAndUpdate(
        { code: code.toUpperCase() },
        updateData,
        { new: true, runValidators: false }
    );
};

export const deleteCoupon = async (code) => {
    return await Coupon.findOneAndDelete({ code: code.toUpperCase() });
};

export const listCoupons = async (filter = {}) => {
    return await Coupon.find(filter).sort({ createdAt: -1 });
};

// ---- Discount calculation with planId check ----
export const calculateDiscount = async (couponCode, amount, planId = null) => {
    if (!couponCode) {
        return { discount: 0, finalAmount: amount, couponCode: null };
    }
    if (typeof amount !== 'number' || amount < 0) {
        throw new Error('Amount must be a non-negative number');
    }

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) {
        throw new Error('Invalid coupon code');
    }
    if (!coupon.isActive) {
        throw new Error('Coupon is inactive');
    }

    // Check plan applicability
    if (coupon.planId !== null && coupon.planId !== planId) {
        throw new Error(`Coupon is not valid for plan ${planId}`);
    }

    let discount = 0;
    switch (coupon.type) {
        case 'percentage':
            discount = (amount * coupon.value) / 100;
            break;
        case 'fixed':
            discount = coupon.value;
            break;
        case 'direct':
            discount = amount - coupon.value;
            break;
    }

    discount = Math.min(discount, amount);
    const finalAmount = Math.max(0, amount - discount);

    return {
        discount,
        finalAmount,
        couponCode: coupon.code,
    };
};