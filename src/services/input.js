import express from 'express'
import prisma from '../db/prisma.js'
const router = express.Router()
import verification from '../middleware/verification.js'

const getAllInputs = async (req, res) => {
    try {
        const inputs = await prisma.input.findMany({
            where: {
                isDeleted: false
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                product: true,
                user: true
            }
        })
        return res.status(200).json({ status: 200, message: "Success", data: inputs })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}

const getInput = async (req, res) => {
    const { id } = req.params
    try {
        const input = await prisma.input.findUnique({
            where: {
                id
            },
            include: {
                product: true,
                user: true
            }
        })

        if (!input || input.isDeleted) {
            return res.status(404).json({ status: 404, message: "Data tidak ditemukan!" })
        }

        return res.status(200).json({ status: 200, message: "Success", data: input })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}

const createInput = async (req, res) => {
    const { productId, amount } = req.body
    const { id: userId } = req.decoded

    if (!productId || !amount) {
        return res.status(400).json({ status: 400, message: "Harap isi semua field!" })
    }

    if (isNaN(Number(amount))) {
        return res.status(400).json({ status: 400, message: "Jumlah harus berupa angka!" })
    }
    try {
        const product = await prisma.product.findUnique({
            where: {
                id: productId
            },
            select: {
                stock: true,
                id: true
            }
        })

        if (!product) {
            return res.status(404).json({ status: 404, message: "Produk tidak ditemukan!" })
        }

        const [input, updatedProduct] = await Promise.all([
            prisma.input.create({
                data: {
                    amount: Number(amount),
                    userId,
                    productId,
                },
            }),
            prisma.product.update({
                where: {
                    id: product.id
                },
                data: {
                    stock: product.stock + Number(amount)
                }
            })
        ])

        return res.status(200).json({ status: 200, message: "Berhasil menambahkan data!", data: input })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}

const editInput = async (req, res) => {
    const { id } = req.params
    const { amount } = req.body
    const { id: userId } = req.decoded

    if (!amount) {
        return res.status(400).json({ status: 400, message: "Harap isi semua field!" })
    }

    if (isNaN(Number(amount))) {
        return res.status(400).json({ status: 400, message: "Jumlah harus berupa angka!" })
    }
    try {

        const check = await prisma.input.findUnique({
            where: {
                id
            },
            select: {
                product: {
                    select: {
                        stock: true,
                        id: true
                    }
                },
                amount: true
            }
        })

        if (!check) {
            return res.status(404).json({ status: 404, message: "Data tidak ditemukan!" })
        }

        const gapAmount = Number(amount) - check.amount
        const newAmount = check.product.stock + gapAmount

        if (newAmount < 0) {
            return res.status(400).json({ status: 400, message: "Stock yang tersedia tidak mencukupi!" })
        }

        await Promise.all([
            prisma.input.update({
                where: {
                    id
                },
                data: {
                    amount: Number(amount),
                    userId,
                },
                include: {
                    product: true
                }
            }),
            prisma.product.update({
                where: {
                    id: check.product.id
                },
                data: {
                    stock: newAmount
                }
            })
        ])

        return res.status(200).json({ status: 200, message: "Berhasil mengubah data!", data: check })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}

const deleteInput = async (req, res) => {
    const { id } = req.params
    try {
        const input = await prisma.input.update({
            where: {
                id
            },
            data: {
                isDeleted: true
            },
            select: {
                product: {
                    select: {
                        stock: true,
                        id: true
                    }
                },
                amount: true
            }
        })

        await prisma.product.update({
            where: {
                id: input.product.id
            },
            data: {
                stock: input.product.stock - input.amount
            }
        })
        return res.status(200).json({ status: 200, message: 'Berhasil menghapus data!', data: input })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}


router.get("/", verification(["Admin", "Employee"]), getAllInputs)
router.get("/:id", verification(["Admin", "Employee"]), getInput)
router.post("/", verification(["Admin", "Employee"]), createInput)
router.put("/:id", verification(["Admin", "Employee"]), editInput)
router.delete("/:id", verification(["Admin", "Employee"]), deleteInput)

export default router