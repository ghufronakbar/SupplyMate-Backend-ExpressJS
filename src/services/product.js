import express from 'express'
import prisma from '../db/prisma.js'
const router = express.Router()
import verification from '../middleware/verification.js'

const getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                isDeleted: false
            },
            orderBy: {
                name: "asc"
            }
        })
        return res.status(200).json({ status: 200, message: "Success", data: products })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}

const getProduct = async (req, res) => {
    const { id } = req.params
    try {
        const product = await prisma.product.findUnique({
            where: {
                id
            }
        })

        if (!product || product.isDeleted) {
            return res.status(404).json({ status: 404, message: "Produk tidak ditemukan!" })
        }

        return res.status(200).json({ status: 200, message: "Success", data: product })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}

const createProduct = async (req, res) => {
    const { name, buyPrice, sellPrice, unit, image, uniqueCode, stock } = req.body
    const { id: userId } = req.decoded
    if (!name || !buyPrice || !sellPrice || !unit || !uniqueCode) {
        return res.status(400).json({ status: 400, message: 'Harap isi semua field' })
    }
    if (isNaN(Number(buyPrice)) || isNaN(Number(sellPrice))) {
        return res.status(400).json({ status: 400, message: 'Harga harus berupa angka' })
    }
    if (isNaN(Number(stock))) {
        return res.status(400).json({ status: 400, message: 'Stock harus berupa angka' })
    }
    try {
        const checkUniqueCode = await prisma.product.findUnique({
            where: {
                uniqueCode
            },
            select: {
                id: true
            }
        })

        if (checkUniqueCode) {
            return res.status(400).json({ status: 400, message: 'Kode Produk sudah digunakan' })
        }

        const product = await prisma.product.create({
            data: {
                name,
                buyPrice: Number(buyPrice),
                sellPrice: Number(sellPrice),
                unit,
                image: image || null,
                stock: Number(stock),
                uniqueCode,
                inputs: {
                    create: {
                        amount: Number(stock),
                        userId
                    }
                }
            }
        })
        return res.status(200).json({ status: 200, message: 'Berhasil menambahkan produk!', data: product })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}

const editProduct = async (req, res) => {
    const { id } = req.params
    const { name, buyPrice, sellPrice, unit, image, uniqueCode } = req.body
    if (!name || !buyPrice || !sellPrice || !unit || !uniqueCode) {
        return res.status(400).json({ status: 400, message: 'Harap isi semua field' })
    }
    if (isNaN(Number(buyPrice)) || isNaN(Number(sellPrice))) {
        return res.status(400).json({ status: 400, message: 'Harga harus berupa angka' })
    }
    try {
        const product = await prisma.product.update({
            where: {
                id
            },
            data: {
                name,
                buyPrice: Number(buyPrice),
                sellPrice: Number(sellPrice),
                unit,
                image: image || null,
                uniqueCode
            }
        })
        return res.status(200).json({ status: 200, message: 'Berhasil mengedit produk!', data: product })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}

const deleteProduct = async (req, res) => {
    const { id } = req.params
    try {
        const product = await prisma.product.update({
            where: {
                id
            },
            data: {
                isDeleted: true
            }
        })
        return res.status(200).json({ status: 200, message: 'Berhasil menghapus produk!', data: product })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}

const checkByUniqueCode = async (req, res) => {
    const { code } = req.params
    try {
        const product = await prisma.product.findUnique({
            where: {
                uniqueCode: code
            },
            select: {
                id: true
            }
        })
        if (!product || product.isDeleted) {
            return res.status(404).json({ status: 404, message: 'Produk tidak ditemukan!' })
        }
        return res.status(200).json({ status: 200, message: 'Success', data: product })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: 'Terjadi Kesalahan Sistem!' })
    }
}


router.get("/", verification(["Admin", "Pegawai", "Manager"]), getAllProducts)
router.get("/:id", verification(["Admin", "Pegawai", "Manager"]), getProduct)
router.get("/:code/code", verification(["Admin", "Pegawai", "Manager"]), checkByUniqueCode)
router.post("/", verification(["Admin", "Pegawai", "Manager"]), createProduct)
router.put("/:id", verification(["Admin", "Pegawai", "Manager"]), editProduct)
router.delete("/:id", verification(["Admin", "Pegawai", "Manager"]), deleteProduct)

export default router