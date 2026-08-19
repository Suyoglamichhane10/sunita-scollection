const Product = require('../Models/Product');
const mongoose = require('mongoose');

const decrementStock = async (items, session) => {
  const activeSession = session || null;

  for (const li of items) {
    if (!li.product) continue;

    const updateQuery = {
      $inc: {
        stock: -li.quantity,
        soldCount: li.quantity,
      },
    };

    if (li.variantSku) {
      const result = await Product.findOneAndUpdate(
        {
          _id: li.product,
          'variants.sku': li.variantSku,
          'variants.stock': { $gte: li.quantity },
        },
        {
          $inc: { 'variants.$.stock': -li.quantity },
          ...updateQuery,
        },
        { new: true, session: activeSession }
      );

      if (!result) {
        const product = await Product.findById(li.product).session(activeSession);
        if (!product) {
          throw new Error(`Product not found: ${li.product}`);
        }
        const variant = product.variants.find((v) => v.sku === li.variantSku);
        if (!variant) {
          throw new Error(`Variant not found: ${li.variantSku}`);
        }
        if (variant.stock < li.quantity) {
          throw new Error(`Insufficient stock for variant ${li.variantSku}. Available: ${variant.stock}, Required: ${li.quantity}`);
        }
      }
    } else {
      const result = await Product.findOneAndUpdate(
        {
          _id: li.product,
          stock: { $gte: li.quantity },
        },
        updateQuery,
        { new: true, session: activeSession }
      );

      if (!result) {
        const product = await Product.findById(li.product).session(activeSession);
        if (!product) {
          throw new Error(`Product not found: ${li.product}`);
        }
        if (product.stock < li.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${li.quantity}`);
        }
      }
    }
  }
};

const restoreStock = async (items, session) => {
  const activeSession = session || null;

  for (const li of items) {
    if (!li.product) continue;

    const updateQuery = {
      $inc: {
        stock: li.quantity,
        soldCount: -li.quantity,
      },
    };

    if (li.variantSku) {
      await Product.findOneAndUpdate(
        { _id: li.product, 'variants.sku': li.variantSku },
        { $inc: { 'variants.$.stock': li.quantity }, ...updateQuery },
        { new: true, session: activeSession }
      );
    } else {
      await Product.findOneAndUpdate(
        { _id: li.product },
        updateQuery,
        { new: true, session: activeSession }
      );
    }
  }
};

const checkStockAvailability = async (items) => {
  const issues = [];

  for (const li of items) {
    if (!li.product) continue;

    const product = await Product.findById(li.product);
    if (!product) {
      issues.push({ product: li.product, issue: 'Product not found' });
      continue;
    }

    if (li.variantSku && product.variants && product.variants.length) {
      const variant = product.variants.find((v) => v.sku === li.variantSku);
      if (!variant) {
        issues.push({ product: li.product, variant: li.variantSku, issue: 'Variant not found' });
      } else if (variant.stock < li.quantity) {
        issues.push({
          product: li.product,
          variant: li.variantSku,
          issue: `Insufficient stock. Available: ${variant.stock}, Required: ${li.quantity}`,
        });
      }
    } else if (product.stock < li.quantity) {
      issues.push({
        product: li.product,
        issue: `Insufficient stock. Available: ${product.stock}, Required: ${li.quantity}`,
      });
    }
  }

  return issues;
};

const reserveStock = async (items, holdMinutes = 15) => {
  const issues = await checkStockAvailability(items);
  return issues.length === 0;
};

module.exports = {
  decrementStock,
  restoreStock,
  checkStockAvailability,
  reserveStock,
};