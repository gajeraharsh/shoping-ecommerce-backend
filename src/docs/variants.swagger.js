/**
 * Variants Endpoints Swagger Documentation
 */

/**
 * @swagger
 * /api/variants:
 *   get:
 *     summary: Get product variants
 *     tags: [Variants]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to get variants for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Variants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Variants retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variant'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Product ID is required
 */

/**
 * @swagger
 * /api/variants/{id}:
 *   get:
 *     summary: Get variant by ID
 *     tags: [Variants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Variant retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Variant retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Variant'
 *       404:
 *         description: Variant not found
 */

/**
 * @swagger
 * /admin/variants:
 *   get:
 *     summary: Get all variants (Admin)
 *     tags: [Admin, Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Variants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variant'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *
 *   post:
 *     summary: Create new variant (Admin)
 *     tags: [Admin, Variants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - name
 *               - price
 *               - stock
 *             properties:
 *               productId:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "iPhone 14 - 128GB Black"
 *               sku:
 *                 type: string
 *                 example: "IPH14-128-BLK"
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 999.99
 *               stock:
 *                 type: integer
 *                 example: 25
 *               attributes:
 *                 type: string
 *                 description: JSON string of attributes object
 *                 example: '{"storage": "128GB", "color": "Black"}'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Variant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Variant created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Variant'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */

/**
 * @swagger
 * /admin/variants/{id}:
 *   get:
 *     summary: Get variant by ID (Admin)
 *     tags: [Admin, Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Variant retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Variant'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Variant not found
 *
 *   put:
 *     summary: Update variant (Admin)
 *     tags: [Admin, Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               stock:
 *                 type: integer
 *               attributes:
 *                 type: string
 *                 description: JSON string of attributes object
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Variant updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Variant not found
 *
 *   delete:
 *     summary: Delete variant (Admin)
 *     tags: [Admin, Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Variant deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Variant not found
 */
