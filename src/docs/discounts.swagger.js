/**
 * Discounts Endpoints Swagger Documentation
 */

/**
 * @swagger
 * /api/discounts/validate:
 *   post:
 *     summary: Validate discount code
 *     tags: [Discounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - orderAmount
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SAVE20"
 *               orderAmount:
 *                 type: number
 *                 format: float
 *                 example: 100.00
 *     responses:
 *       200:
 *         description: Discount code validated successfully
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
 *                   example: "Discount code is valid"
 *                 data:
 *                   type: object
 *                   properties:
 *                     discount:
 *                       $ref: '#/components/schemas/Discount'
 *                     discountAmount:
 *                       type: number
 *                       format: float
 *                       example: 20.00
 *                     finalAmount:
 *                       type: number
 *                       format: float
 *                       example: 80.00
 *       400:
 *         description: Invalid or expired discount code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /admin/discounts:
 *   get:
 *     summary: Get all discounts (Admin)
 *     tags: [Admin, Discounts]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by code or name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PERCENTAGE, FIXED]
 *     responses:
 *       200:
 *         description: Discounts retrieved successfully
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
 *                     $ref: '#/components/schemas/Discount'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *
 *   post:
 *     summary: Create new discount (Admin)
 *     tags: [Admin, Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - type
 *               - value
 *               - startDate
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SAVE20"
 *               name:
 *                 type: string
 *                 example: "20% Off Summer Sale"
 *               description:
 *                 type: string
 *                 example: "Get 20% off on all summer items"
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *                 example: "PERCENTAGE"
 *               value:
 *                 type: number
 *                 format: float
 *                 example: 20
 *               minOrderAmount:
 *                 type: number
 *                 format: float
 *                 example: 100
 *               maxDiscountAmount:
 *                 type: number
 *                 format: float
 *                 example: 50
 *               usageLimit:
 *                 type: integer
 *                 example: 100
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-06-01T00:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-08-31T23:59:59Z"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Discount created successfully
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
 *                   example: "Discount created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Discount'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Discount code already exists
 */

/**
 * @swagger
 * /admin/discounts/{id}:
 *   get:
 *     summary: Get discount by ID (Admin)
 *     tags: [Admin, Discounts]
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
 *         description: Discount retrieved successfully
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
 *                   $ref: '#/components/schemas/Discount'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Discount not found
 *
 *   put:
 *     summary: Update discount (Admin)
 *     tags: [Admin, Discounts]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               value:
 *                 type: number
 *                 format: float
 *               minOrderAmount:
 *                 type: number
 *                 format: float
 *               maxDiscountAmount:
 *                 type: number
 *                 format: float
 *               usageLimit:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Discount updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Discount not found
 *
 *   delete:
 *     summary: Delete discount (Admin)
 *     tags: [Admin, Discounts]
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
 *         description: Discount deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Discount not found
 */
