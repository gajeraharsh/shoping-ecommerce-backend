/**
 * Soft Delete Utility
 * Helper functions for consistent soft delete behavior across all models
 */

/**
 * Mark a record as deleted (soft delete)
 * @param {string} prismaModel - Prisma model name (e.g., 'product', 'user')
 * @param {number|string} id - Record ID
 * @param {Object} prisma - Prisma client instance
 * @returns {Promise} Updated record
 */
const markDeleted = async (prismaModel, id, prisma) => {
  return prisma[prismaModel].update({
    where: { id: Number(id) },
    data: { 
      isDeleted: true, 
      deletedAt: new Date() 
    }
  });
};

/**
 * Add isDeleted: false to where clause to exclude soft deleted records
 * @param {Object} where - Existing where clause
 * @returns {Object} Where clause with isDeleted: false
 */
const notDeletedWhere = (where = {}) => ({
  isDeleted: false,
  ...where
});

/**
 * Include deleted records in query (admin only)
 * @param {Object} where - Existing where clause
 * @param {boolean} includeDeleted - Whether to include deleted records
 * @returns {Object} Where clause
 */
const withDeletedWhere = (where = {}, includeDeleted = false) => {
  if (includeDeleted) {
    return where;
  }
  return notDeletedWhere(where);
};

/**
 * Hard delete a record (permanent deletion)
 * @param {string} prismaModel - Prisma model name
 * @param {number|string} id - Record ID
 * @param {Object} prisma - Prisma client instance
 * @returns {Promise} Deleted record
 */
const hardDelete = async (prismaModel, id, prisma) => {
  return prisma[prismaModel].delete({
    where: { id: Number(id) }
  });
};

module.exports = {
  markDeleted,
  notDeletedWhere,
  withDeletedWhere,
  hardDelete
};
