import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

const seedAdmin = async () => {
    const check = await prisma.user.findFirst({
        where: {
            AND: [
                {
                    isDeleted: false
                },
                {
                    role: "Admin"
                }
            ]
        }
    })
    if (!check) {
        const password = await bcrypt.hash("12345678", 10)
        const admin = await prisma.user.create({
            data: {
                name: "Admin",
                email: "admin@example.com",
                password,
                role: "Admin",
                address: "Ngaglik 56172, Sleman, Yogyakarta, Indonesia",
                countryCode: "+62",
                phone: "85156031385",
            }
        })
        console.log("Admin created", admin.email)
    } else {
        console.log("Admin already exist")
    }
}

const seedEmployee = async () => {
    const check = await prisma.user.findFirst({
        where: {
            AND: [
                {
                    isDeleted: false
                },
                {
                    role: "Pegawai"
                }
            ]
        }
    })
    if (!check) {
        const password = await bcrypt.hash("12345678", 10)
        const employee = await prisma.user.create({
            data: {
                name: "Employee",
                email: "employee@example.com",
                password,
                role: "Pegawai",
                address: "Ngaglik 56172, Sleman, Yogyakarta, Indonesia",
                countryCode: "+62",
                phone: "85156031385",
            }
        })
        console.log("Employee created", employee.email)
    } else {
        console.log("Employee already exist")
    }
}

const seedManager = async () => {
    const check = await prisma.user.findFirst({
        where: {
            AND: [
                {
                    isDeleted: false
                },
                {
                    role: "Manager"
                }
            ]
        }
    })
    if (!check) {
        const password = await bcrypt.hash("12345678", 10)
        const employee = await prisma.user.create({
            data: {
                name: "Manager",
                email: "manager@example.com",
                password,
                role: "Manager",
                address: "Ngaglik 56172, Sleman, Yogyakarta, Indonesia",
                countryCode: "+62",
                phone: "85156031385",
            }
        })
        console.log("Manager created", employee.email)
    } else {
        console.log("Manager already exist")
    }
}

const seedProducts = async () => {
    const check = await prisma.product.findFirst({
        where: {
            isDeleted: false
        }
    })

    if (!check) {
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {

                        role: "Manager"
                    },
                    {
                        isDeleted: false
                    }
                ]
            }
        })
        const products = await prisma.product.createManyAndReturn({
            data: [
                {
                    name: "Beras",
                    buyPrice: 10000,
                    sellPrice: 15000,
                    unit: "kg",
                    image: "https://kramatlaban-padarincang.desa.id/wp-content/uploads/2023/08/beras.jpg",
                    stock: 10,
                    uniqueCode: "B001"
                },
                {
                    name: "Gula",
                    buyPrice: 5000,
                    sellPrice: 8000,
                    unit: "kg",
                    image: "https://asset.kompas.com/crops/uiBT1A4jP_n-jGiIShXIlBJlzQQ=/0x0:1500x1000/1200x800/data/photo/2023/11/12/6550fcbea6729.jpg",
                    stock: 15,
                    uniqueCode: "G001"
                },
                {
                    name: "Telur",
                    buyPrice: 20000,
                    sellPrice: 30000,
                    unit: "kg",
                    image: "https://cdn.hellosehat.com/wp-content/uploads/2016/09/risiko-makan-telur.jpg?w=1080&q=100",
                    stock: 50,
                    uniqueCode: "T001"
                },
                {
                    name: "Minyak Goreng",
                    buyPrice: 15000,
                    sellPrice: 20000,
                    unit: "liter",
                    image: "https://allofresh.id/blog/wp-content/uploads/2023/08/merek-minyak-goreng-4.jpg",
                    stock: 60,
                    uniqueCode: "M001"
                },
            ],
        })

        for (const product of products) {
            await prisma.input.create({
                data: {
                    productId: product.id,
                    amount: product.stock,
                    userId: users[0].id,
                }
            })
        }
        console.log("Products are created", products)
    } else {
        console.log("Product already exist")
    }
}

const seedPartners = async () => {
    const check = await prisma.partner.findFirst({
        where: {
            isDeleted: false
        }
    })
    if (!check) {
        const partners = await prisma.partner.createManyAndReturn({
            data: [
                {
                    name: "SRC Tiga Bersaudara",
                    address: "Jl. Raya Bulak, Bulak, Kec. Bulak, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
                    countryCode: "+62",
                    phone: "85256031385",
                    pic: "Levi Ackerman",
                    image: "https://lh5.googleusercontent.com/p/AF1QipOS2NSIu0nzJ5X9S-ooBXSYmtr1nszsqRpS2X9A=w493-h240-k-no"
                },
                {
                    name: "SRC Barokah",
                    address: "Jl. Letnan Tukiyat Nglerep, Pandeyan 1, Deyangan, Kec. Mertoyudan, Kabupaten Magelang, Jawa Tengah 56511",
                    countryCode: "+62",
                    phone: "85256031385",
                    pic: "Barokah Ackerman",
                    image: "https://assets.promediateknologi.id/crop/0x0:0x0/0x0/webp/photo/p2/100/2023/09/10/1-SRC-barokah-Kraksaan-3350506373.jpg"
                }
            ]
        })

        console.log("Partners are created", partners)
    } else {
        console.log("Partner already exist")
    }
}

const main = async () => {
    console.log("Seeding data...")
    await Promise.all([seedAdmin(), seedEmployee(), seedManager(), seedPartners()])
    await seedProducts()
    console.log("Seeding data success")
    await prisma.$disconnect()
}

main()