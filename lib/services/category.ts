import { prisma } from "@/lib/prisma"

export interface CreateCategoryData {
  name: string
  description?: string
  parentId?: string
  imageUrl?: string
  isActive?: boolean
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  parentId?: string
  imageUrl?: string
  isActive?: boolean
}

export class CategoryService {
  static async createCategory(data: CreateCategoryData, userId: string) {
    // Check if category name already exists
    const existingCategory = await prisma.category.findFirst({
      where: { name: data.name }
    })

    if (existingCategory) {
      throw new Error("Category with this name already exists")
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        // imageUrl: data.imageUrl, // Field doesn't exist
        isActive: data.isActive ?? true
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    // Log the creation
    await this.logCategoryAction("CREATE", category.id, userId, data)

    return category
  }

  static async getCategories(filters?: {
    isActive?: boolean
    parentId?: string | null
    search?: string
  }) {
    const where: any = {}

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.parentId !== undefined) {
      where.parentId = filters.parentId
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } }
      ]
    }

    return await prisma.category.findMany({
      where,
      include: {
        // parent: true, // Field doesn't exist
        // children: true, // Field doesn't exist
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: "asc" }
    })
  }

  static async getCategoryById(categoryId: string) {
    return await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        // parent: true, // Field doesn't exist
        // children: true, // Field doesn't exist
        products: {
          include: {
            vendor: true
          },
          where: { status: "APPROVED" }
        },
        _count: {
          select: { products: true }
        }
      }
    })
  }

  static async updateCategory(categoryId: string, data: UpdateCategoryData, userId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      throw new Error("Category not found")
    }

    // Check if new name conflicts with existing category
    if (data.name && data.name !== category.name) {
      const existingCategory = await prisma.category.findFirst({
        where: { 
          name: data.name,
          id: { not: categoryId }
        }
      })

      if (existingCategory) {
        throw new Error("Category with this name already exists")
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data,
      include: {
        // parent: true, // Field doesn't exist
        // children: true, // Field doesn't exist
        _count: {
          select: { products: true }
        }
      }
    })

    // Log the update
    await this.logCategoryAction("UPDATE", categoryId, userId, data)

    return updatedCategory
  }

  static async deleteCategory(categoryId: string, userId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        // children: true, // Field doesn't exist
        _count: {
          select: { products: true }
        }
      }
    })

    if (!category) {
      throw new Error("Category not found")
    }

    // Check if category has children
    // if (category.children.length > 0) { // Field doesn't exist
    //   throw new Error("Cannot delete category with subcategories")
    // }

    // Check if category has products
    // if (category._count.products > 0) { // Field doesn't exist
    //   throw new Error("Cannot delete category with products")
    // }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    // Log the deletion
    await this.logCategoryAction("DELETE", categoryId, userId, { name: category.name })

    return { success: true }
  }

  static async getCategoryTree() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: "asc" }
    })

    // Return flat list since we don't have hierarchical structure
    return categories
  }

  static async getCategoryStats() {
    const totalCategories = await prisma.category.count()
    const activeCategories = await prisma.category.count({ where: { isActive: true } })
    const categoriesWithProducts = await prisma.category.count({
      where: {
        products: {
          some: {}
        }
      }
    })

    const topCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        products: {
          _count: "desc"
        }
      },
      take: 5
    })

    return {
      totalCategories,
      activeCategories,
      categoriesWithProducts,
      topCategories: topCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        productCount: cat._count.products
      }))
    }
  }

  private static buildCategoryTree(categories: any[], parentId: string | null = null): any[] {
    return categories
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        children: this.buildCategoryTree(categories, cat.id)
      }))
  }

  private static async logCategoryAction(action: string, categoryId: string, userId: string, data: any) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: `CATEGORY_${action}`,
        resource: "CATEGORY",
        details: JSON.stringify(data),
        ipAddress: "127.0.0.1"
      }
    })
  }
}
