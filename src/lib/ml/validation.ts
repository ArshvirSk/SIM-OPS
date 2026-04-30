/**
 * ML Data Validation
 * Type guards and validation functions for ML data
 */

import type { Customer } from "@/types/database";
import { ValidationError } from "@/types/errors";
import { isObject, hasStringProperty, hasNumberProperty } from "@/types/utils";

/**
 * Validate customer data for churn prediction
 * Throws ValidationError if customer data is invalid
 */
export function validateCustomerForChurn(customer: unknown): asserts customer is Customer {
  if (!isObject(customer)) {
    throw new ValidationError("Customer must be an object");
  }

  if (!hasStringProperty(customer, "id")) {
    throw new ValidationError("Customer must have a valid id");
  }

  if (!hasStringProperty(customer, "email")) {
    throw new ValidationError("Customer must have a valid email");
  }

  if (!hasStringProperty(customer, "created_at")) {
    throw new ValidationError("Customer must have a valid created_at date");
  }

  // Validate numeric fields
  const numericFields = [
    "support_tickets",
    "payment_failures",
    "total_spend",
    "total_purchases",
    "avg_purchase_value",
    "feature_usage_rate",
    "avg_session_duration",
    "discount_usage",
    "referrals_made",
    "engagement_score",
  ];

  for (const field of numericFields) {
    if (!hasNumberProperty(customer, field)) {
      throw new ValidationError(`Customer must have a valid ${field} number`);
    }
  }

  // Validate status
  if (!hasStringProperty(customer, "status")) {
    throw new ValidationError("Customer must have a valid status");
  }

  const validStatuses = ["active", "at_risk", "churned"];
  if (!validStatuses.includes(customer.status)) {
    throw new ValidationError(
      `Customer status must be one of: ${validStatuses.join(", ")}`
    );
  }
}

/**
 * Validate customer data for CLV prediction
 * Throws ValidationError if customer data is invalid
 */
export function validateCustomerForCLV(customer: unknown): asserts customer is Customer {
  // CLV uses same validation as churn
  validateCustomerForChurn(customer);

  // Additional CLV-specific validations could go here
  const typedCustomer = customer as Customer;

  if (typedCustomer.total_purchases < 0) {
    throw new ValidationError("Customer total_purchases cannot be negative");
  }

  if (typedCustomer.avg_purchase_value < 0) {
    throw new ValidationError("Customer avg_purchase_value cannot be negative");
  }
}

/**
 * Type guard for valid customer
 */
export function isValidCustomer(customer: unknown): customer is Customer {
  try {
    validateCustomerForChurn(customer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for customer with required churn fields
 */
export function hasChurnFields(customer: unknown): customer is Customer {
  if (!isObject(customer)) {
    return false;
  }

  return (
    hasStringProperty(customer, "id") &&
    hasStringProperty(customer, "created_at") &&
    hasNumberProperty(customer, "support_tickets") &&
    hasNumberProperty(customer, "payment_failures") &&
    hasNumberProperty(customer, "feature_usage_rate")
  );
}

/**
 * Type guard for customer with required CLV fields
 */
export function hasCLVFields(customer: unknown): customer is Customer {
  if (!isObject(customer)) {
    return false;
  }

  return (
    hasStringProperty(customer, "id") &&
    hasNumberProperty(customer, "total_purchases") &&
    hasNumberProperty(customer, "avg_purchase_value") &&
    hasNumberProperty(customer, "engagement_score")
  );
}

/**
 * Validate array of customers
 */
export function validateCustomerArray(
  customers: unknown
): asserts customers is Customer[] {
  if (!Array.isArray(customers)) {
    throw new ValidationError("Customers must be an array");
  }

  if (customers.length === 0) {
    throw new ValidationError("Customers array cannot be empty");
  }

  for (let i = 0; i < customers.length; i++) {
    try {
      validateCustomerForChurn(customers[i]);
    } catch (error) {
      throw new ValidationError(
        `Invalid customer at index ${i}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

/**
 * Type guard for customer array
 */
export function isCustomerArray(customers: unknown): customers is Customer[] {
  try {
    validateCustomerArray(customers);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe customer extraction from unknown data
 */
export function extractCustomer(data: unknown): Customer | null {
  if (!isValidCustomer(data)) {
    return null;
  }
  return data;
}

/**
 * Safe customer array extraction from unknown data
 */
export function extractCustomerArray(data: unknown): Customer[] {
  if (!isCustomerArray(data)) {
    return [];
  }
  return data;
}
