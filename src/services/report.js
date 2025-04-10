import express from 'express'
import prisma from '../db/prisma.js'
const router = express.Router()
import ExcelJS from 'exceljs';

/**
 * Expected Output Data
 * {
 *    "product": "Name Product",
 *    "data": [
 *          {
 *              "product": "Name Product",
 *              "quantity": 10,
 *              "unit": "kg",
 *              "date": "Senin, 20 Januari 2023",
 *              "entity": "Lans"
 *          }
 *    ]
 * }[]
 * 
 * 
 */

/**
 * Fungsi untuk menghasilkan file Excel dari data input produk.
 * @param {Array} data - Array data produk yang akan diekspor ke Excel.
 * @returns {Promise<Buffer>} - Mengembalikan buffer Excel yang bisa dikirim melalui response.
 */
const generateExcelTrans = async (data, title, entity) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);
    
    worksheet.columns = [
        { header: 'Produk', key: 'product', width: 20, },
        { header: 'Jumlah', key: 'quantity', width: 10 },
        { header: 'Satuan', key: 'unit', width: 10 },
        { header: 'Tanggal', key: 'date', width: 20 },
        { header: entity, key: 'entity', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    
    data.forEach(item => {
        worksheet.addRow({ product: item.product }).font = { bold: true };
        item.data.forEach(dataItem => {
            worksheet.addRow({
                product: dataItem.product,
                quantity: dataItem.quantity,
                unit: dataItem.unit,
                date: dataItem.date,
                entity: dataItem.entity,
            });
        });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};


const generateExcelMaster = async (data, title, infoTitle, totalTitle) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);
    
    worksheet.columns = [
        { header: 'Nama', key: 'name', width: 30, },
        { header: totalTitle, key: 'total', width: 15 },
        { header: infoTitle, key: 'info', width: 30 },
        { header: 'Terdaftar Pada', key: 'date', width: 25 },
    ];

    worksheet.getRow(1).font = { bold: true };
    
    data.forEach(item => {
        worksheet.addRow({ name: item.name, info: item.info, total: item.total, date: item.date })
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};



const getInputExcel = async (req, res) => {
    const { type } = req.query
    const isWeekly = type === 'weekly'
    const isMonthly = type === 'monthly'
    try {
        const data = [];
        const inputs = await prisma.input.findMany({
            where: {
                AND: [
                    {
                        isDeleted: false
                    },
                    isWeekly ? {
                        createdAt: {
                            gte: new Date(new Date().setDate(new Date().getDate() - 7))
                        }
                    } :
                        isMonthly ? {
                            createdAt: {
                                gte: new Date(new Date().setDate(new Date().getDate() - 30))
                            }
                        } : {}
                ]
            },
            select: {
                amount: true,
                createdAt: true,
                product: {
                    select: {
                        name: true,
                        stock: true,
                        unit: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });

        for (const input of inputs) {
            const check = data.find(item => item.product === input.product.name);
            if (check) {
                check.data.push({
                    product: input.product.name,
                    quantity: input.amount,
                    unit: input.product.unit,
                    date: input.createdAt.toISOString().split('T')[0],
                    entity: input.user.name,
                });
            } else {
                data.push({
                    product: input.product.name,
                    data: [{
                        product: input.product.name,
                        quantity: input.amount,
                        unit: input.product.unit,
                        date: input.createdAt.toISOString().split('T')[0],
                        entity: input.user.name,
                    }]
                });
            }
        }
        const formattedType = isWeekly ? 'Mingguan' : isMonthly ? 'Bulanan' : 'Seluruh';

        const title = `Data Rekap Input Produk ${formattedType}`;

        const excelBuffer = await generateExcelTrans(data, title, "Diinput Oleh");

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${title.replaceAll(' ', '_').toLowerCase()}.xlsx;`);

        // Kirim buffer Excel sebagai response
        res.send(excelBuffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' });
    }
};

const getOrderExcel = async (req, res) => {
    const { type } = req.query
    const isWeekly = type === 'weekly'
    const isMonthly = type === 'monthly'
    try {
        const data = [];
        const orderItems = await prisma.orderItem.findMany({
            where: {
                AND: [
                    {
                        isDeleted: false
                    },
                    isWeekly ? {
                        createdAt: {
                            gte: new Date(new Date().setDate(new Date().getDate() - 7))
                        }
                    } :
                        isMonthly ? {
                            createdAt: {
                                gte: new Date(new Date().setDate(new Date().getDate() - 30))
                            }
                        } : {},
                    {
                        order: {
                            finishedAt: {
                                not: null
                            }
                        }
                    }
                ]
            },
            select: {
                quantity: true,
                createdAt: true,
                name: true,
                unit: true,
                order: {
                    select: {
                        partner: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        for (const orderItem of orderItems) {
            const check = data.find(item => item.product === orderItem.name);
            if (check) {
                check.data.push({
                    product: orderItem.name,
                    quantity: orderItem.quantity,
                    unit: orderItem.unit,
                    date: orderItem.createdAt.toISOString().split('T')[0],
                    entity: orderItem.order.partner.name,
                });
            } else {
                data.push({
                    product: orderItem.name,
                    data: [{
                        product: orderItem.name,
                        quantity: orderItem.quantity,
                        unit: orderItem.unit,
                        date: orderItem.createdAt.toISOString().split('T')[0],
                        entity: orderItem.order.partner.name,
                    }]
                });
            }
        }
        const formattedType = isWeekly ? 'Mingguan' : isMonthly ? 'Bulanan' : 'Seluruh';

        const title = `Data Pesanan Produk ${formattedType}`;

        const excelBuffer = await generateExcelTrans(data, title, "Mitra");

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${title.replaceAll(' ', '_').toLowerCase()}.xlsx;`);

        // Kirim buffer Excel sebagai response
        res.send(excelBuffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' });
    }
};

const getPartnerExcel = async (req, res) => {
    try {
        const data = [];
        const partners = await prisma.partner.findMany({
            where: {
                isDeleted: false
            },
            select: {
                name: true,
                pic: true,
                _count: {
                    select: {
                        orders: true
                    }
                },
                createdAt: true,
            }
        });

        for (const partner of partners) {
            data.push({
                name: partner.name,
                info: partner.pic,
                total: partner._count.orders,
                date: partner.createdAt.toISOString().split('T')[0],
            });
        }

        const date = new Date().toISOString().split('T')[0];

        const title = `Data Mitra Terdaftar ${date}`;

        const excelBuffer = await generateExcelMaster(data, title, "Penanggung Jawab", "Jumlah Pesanan");

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${title.replaceAll(' ', '_').toLowerCase()}.xlsx;`);

        // Kirim buffer Excel sebagai response
        res.send(excelBuffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' });
    }
};

const getProductExcel = async (req, res) => {
    try {
        const data = [];
        const products = await prisma.product.findMany({
            where: {
                isDeleted: false
            },
            select: {
                name: true,
                unit: true,
                stock: true,                
                createdAt: true,
            }
        });

        for (const partner of products) {
            data.push({
                name: partner.name,
                info: partner.unit,
                total: partner.stock,
                date: partner.createdAt.toISOString().split('T')[0],
            });
        }

        const date = new Date().toISOString().split('T')[0];

        const title = `Data Produk Terdaftar ${date}`;

        const excelBuffer = await generateExcelMaster(data, title, "Satuan", "Stok");

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${title.replaceAll(' ', '_').toLowerCase()}.xlsx;`);

        // Kirim buffer Excel sebagai response
        res.send(excelBuffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' });
    }
};


router.get("/input", getInputExcel);
router.get("/order", getOrderExcel);
router.get("/partner", getPartnerExcel)
router.get("/product", getProductExcel)

export default router;
