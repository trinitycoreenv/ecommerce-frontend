import { PrismaClient, UserRole, SubscriptionTier, ProductStatus, OrderStatus, TransactionStatus, PayoutStatus, ReportType, ShipmentStatus, CommissionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Real vendor data will be added when needed
const philippineVendors: any[] = []

// Real customer data will be added when needed
const philippineCustomers: any[] = []

async function main() {
  console.log('🌱 Starting comprehensive database seed...')

  // Create comprehensive categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Electronics & Gadgets',
        description: 'Smartphones, laptops, tablets, and electronic accessories',
        policyRules: {
          requiresApproval: true,
          maxPrice: 50000,
          allowedVendors: ['PREMIUM', 'ENTERPRISE'],
          commissionRate: 0.08
        }
      }
    }),
    prisma.category.create({
      data: {
        name: 'Fashion & Apparel',
        description: 'Clothing, shoes, bags, and fashion accessories',
        policyRules: {
          requiresApproval: false,
          maxPrice: 5000,
          allowedVendors: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
          commissionRate: 0.10
        }
      }
    }),
    prisma.category.create({
      data: {
        name: 'Home & Garden',
        description: 'Furniture, home decor, garden tools, and household items',
        policyRules: {
          requiresApproval: true,
          maxPrice: 25000,
          allowedVendors: ['PREMIUM', 'ENTERPRISE'],
          commissionRate: 0.08
        }
      }
    }),
    prisma.category.create({
      data: {
        name: 'Beauty & Personal Care',
        description: 'Skincare, makeup, hair care, and personal hygiene products',
        policyRules: {
          requiresApproval: false,
          maxPrice: 3000,
          allowedVendors: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
          commissionRate: 0.10
        }
      }
    }),
    prisma.category.create({
      data: {
        name: 'Sports & Recreation',
        description: 'Sports equipment, fitness gear, and outdoor recreation items',
        policyRules: {
          requiresApproval: false,
          maxPrice: 8000,
          allowedVendors: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
          commissionRate: 0.10
        }
      }
    }),
    prisma.category.create({
      data: {
        name: 'Books & Education',
        description: 'Books, educational materials, and learning resources',
        policyRules: {
          requiresApproval: false,
          maxPrice: 2000,
          allowedVendors: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
          commissionRate: 0.12
        }
      }
    }),
    prisma.category.create({
      data: {
        name: 'Health & Wellness',
        description: 'Health supplements, medical devices, and wellness products',
        policyRules: {
          requiresApproval: true,
          maxPrice: 10000,
          allowedVendors: ['PREMIUM', 'ENTERPRISE'],
          commissionRate: 0.08
        }
      }
    }),
    prisma.category.create({
      data: {
        name: 'Automotive',
        description: 'Car accessories, motorcycle parts, and automotive tools',
        policyRules: {
          requiresApproval: true,
          maxPrice: 15000,
          allowedVendors: ['PREMIUM', 'ENTERPRISE'],
          commissionRate: 0.08
        }
      }
    })
  ])

  console.log('✅ Created categories')

  // Create admin users
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ecommerce.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: UserRole.ADMIN
    }
  })

  const financePassword = await bcrypt.hash('finance123', 12)
  const finance = await prisma.user.create({
    data: {
      email: 'finance@ecommerce.com',
      name: 'Finance Analyst',
      passwordHash: financePassword,
      role: UserRole.FINANCE_ANALYST
    }
  })

  const opsPassword = await bcrypt.hash('ops123', 12)
  const operations = await prisma.user.create({
    data: {
      email: 'operations@ecommerce.com',
      name: 'Operations Manager',
      passwordHash: opsPassword,
      role: UserRole.OPERATIONS_MANAGER
    }
  })

  console.log('✅ Created admin users')

  // Create vendor users and profiles
  const vendorPassword = await bcrypt.hash('vendor123', 12)
  const vendorUsers = await Promise.all(
    philippineVendors.map(vendor => 
      prisma.user.create({
        data: {
          email: vendor.email,
          name: vendor.name,
          passwordHash: vendorPassword,
          role: UserRole.VENDOR
        }
      })
    )
  )

  const vendorProfiles = await Promise.all(
    vendorUsers.map((user, index) => 
      prisma.vendor.create({
        data: {
          userId: user.id,
          businessName: philippineVendors[index].businessName,
          businessAddress: philippineVendors[index].businessAddress,
          businessType: philippineVendors[index].businessType,
          taxId: philippineVendors[index].taxId,
          subscriptionTier: philippineVendors[index].subscriptionTier,
          commissionRate: philippineVendors[index].commissionRate,
          status: 'ACTIVE'
        }
      })
    )
  )

  console.log('✅ Created vendor users and profiles')

  // Create customer users
  const customerPassword = await bcrypt.hash('customer123', 12)
  const customerUsers = await Promise.all(
    philippineCustomers.map(customer => 
      prisma.user.create({
        data: {
          email: customer.email,
          name: customer.name,
          passwordHash: customerPassword,
          role: UserRole.CUSTOMER,
          address: customer.address
        }
      })
    )
  )

  console.log('✅ Created customer users')

  // Create subscription plans
  const subscriptionPlans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        name: 'Starter Plan',
        tier: SubscriptionTier.STARTER,
        description: 'Perfect for getting started',
        price: 0,
        billingCycle: 'MONTHLY',
        commissionRate: 15.0,
        maxProducts: 10,
        maxOrders: 25,
        features: ['Up to 10 products', '25 orders/month', '15% commission'],
        isActive: true,
        isPopular: false,
        trialDays: 0
      }
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Basic Plan',
        tier: SubscriptionTier.BASIC,
        description: 'For growing businesses',
        price: 2000,
        billingCycle: 'MONTHLY',
        commissionRate: 12.0,
        maxProducts: 50,
        maxOrders: 100,
        features: ['Up to 50 products', '100 orders/month', '12% commission'],
        isActive: true,
        isPopular: false,
        trialDays: 0
      }
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Pro Plan',
        tier: SubscriptionTier.PREMIUM,
        description: 'For established sellers',
        price: 5000,
        billingCycle: 'MONTHLY',
        commissionRate: 8.0,
        maxProducts: 200,
        maxOrders: 500,
        features: ['Up to 200 products', '500 orders/month', '8% commission', '14-day free trial'],
        isActive: true,
        isPopular: true,
        trialDays: 14
      }
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise Plan',
        tier: SubscriptionTier.ENTERPRISE,
        description: 'For large operations',
        price: 10000,
        billingCycle: 'MONTHLY',
        commissionRate: 5.0,
        maxProducts: -1, // Unlimited
        maxOrders: -1, // Unlimited
        features: ['Unlimited products', 'Unlimited orders', '5% commission'],
        isActive: true,
        isPopular: false,
        trialDays: 0
      }
    })
  ])

  // Create subscriptions for all vendors
  const subscriptions = await Promise.all(
    vendorProfiles.map((vendor, index) => 
      prisma.subscription.create({
        data: {
          vendorId: vendor.id,
          planId: subscriptionPlans.find(plan => plan.tier === vendor.subscriptionTier)?.id,
          tier: vendor.subscriptionTier,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          status: 'ACTIVE',
          price: subscriptionPlans.find(plan => plan.tier === vendor.subscriptionTier)?.price || 0,
          billingCycle: 'MONTHLY',
          nextBillingDate: new Date('2024-12-01'),
          autoRenew: true
        }
      })
    )
  )

  console.log('✅ Created subscription plans and vendor subscriptions')

  // Create comprehensive product data
  // Real product data will be added when needed
  const productData: any[] = []

  const products = await Promise.all(
    productData.map(product => 
      prisma.product.create({
        data: {
          vendorId: vendorProfiles[product.vendor].id,
          categoryId: categories[product.category].id,
          name: product.name,
          description: product.description,
          price: product.price,
          sku: product.sku,
          inventory: product.inventory,
          status: product.status,
          images: product.images,
          weight: Math.floor(Math.random() * 2000) + 100, // Random weight between 100-2100g
          dimensions: {
            length: Math.floor(Math.random() * 50) + 10,
            width: Math.floor(Math.random() * 40) + 8,
            height: Math.floor(Math.random() * 30) + 5
          },
          tags: ['Philippines', 'Premium', 'Quality'],
          lowStockThreshold: 10
        }
      })
    )
  )

  console.log('✅ Created products')

  // Create comprehensive order data
  // Real order data will be added when needed
  const orderData: any[] = []

  const orders = await Promise.all(
    orderData.map((order, index) => {
      const orderDate = new Date()
      orderDate.setDate(orderDate.getDate() - order.daysAgo)
      
      return prisma.order.create({
        data: {
          customerId: customerUsers[order.customer].id,
          vendorId: vendorProfiles[order.vendor].id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalPrice: order.totalPrice,
          subtotal: order.totalPrice * 0.9, // 10% tax
          tax: order.totalPrice * 0.1,
          shippingCost: order.totalPrice > 5000 ? 0 : 200, // Free shipping over 5000
          paymentMethod: 'credit_card',
          shippingAddress: philippineCustomers[order.customer].address,
          billingAddress: philippineCustomers[order.customer].address,
          shippingMethod: {
            carrier: 'LBC Express',
            service: 'Standard',
            estimatedDays: 3
          },
          createdAt: orderDate,
          updatedAt: orderDate
        }
      })
    })
  )

  console.log('✅ Created orders')

  // Create order items for all orders
  const orderItems = []
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const orderInfo = orderData[i]
    
    for (const productIndex of orderInfo.products) {
      const product = products[productIndex]
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: 1,
          price: product.price
        }
      })
      orderItems.push(orderItem)
    }
  }

  console.log('✅ Created order items')

  // Create transactions for all completed orders
  const transactions = []
  for (const order of orders) {
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.SHIPPED) {
      const vendor = vendorProfiles.find(v => v.id === order.vendorId)
      const customer = customerUsers.find(c => c.id === order.customerId)
      
      if (vendor && customer) {
        const commission = Number(order.totalPrice) * Number(vendor.commissionRate)
        const netPayout = Number(order.totalPrice) - commission
        
        const transaction = await prisma.transaction.create({
          data: {
            orderId: order.id,
            vendorId: vendor.id,
            customerId: customer.id,
            amount: order.totalPrice,
            commission: commission,
            netPayout: netPayout,
            status: order.status === OrderStatus.DELIVERED ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
            type: 'ORDER',
            paymentMethod: 'credit_card',
            paymentId: `pay_${order.orderNumber.replace('ORD-', '')}`,
            processedAt: order.status === OrderStatus.DELIVERED ? order.updatedAt : null
          }
        })
        transactions.push(transaction)
      }
    }
  }

  console.log('✅ Created transactions')

  // Create commissions for all transactions
  const commissions = []
  for (const transaction of transactions) {
    const vendor = vendorProfiles.find(v => v.id === transaction.vendorId)
    if (vendor) {
      const commission = await prisma.commission.create({
        data: {
          orderId: transaction.orderId,
          vendorId: transaction.vendorId,
          amount: transaction.commission,
          rate: Number(vendor.commissionRate) * 100, // Convert to percentage
          status: transaction.status === TransactionStatus.COMPLETED ? CommissionStatus.PAID : CommissionStatus.CALCULATED,
          calculatedAt: transaction.createdAt,
          paidAt: transaction.status === TransactionStatus.COMPLETED ? transaction.processedAt : null,
          breakdown: {
            orderAmount: transaction.amount,
            commissionRate: vendor.commissionRate,
            commissionAmount: transaction.commission,
            netPayout: transaction.netPayout
          }
        }
      })
      commissions.push(commission)
    }
  }

  console.log('✅ Created commissions')

  // Create shipments for all orders
  const shipments = []
  const carriers = ['LBC Express', 'J&T Express', '2GO Express', 'Grab Express']
  
  for (const order of orders) {
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CANCELLED) {
      const carrier = carriers[Math.floor(Math.random() * carriers.length)]
      const trackingNumber = `${carrier.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 1000000000)}`
      
      let shipmentStatus: ShipmentStatus = ShipmentStatus.PENDING
      let actualDelivery = null
      
      if (order.status === OrderStatus.DELIVERED) {
        shipmentStatus = ShipmentStatus.DELIVERED
        actualDelivery = new Date(order.updatedAt.getTime() - Math.random() * 24 * 60 * 60 * 1000) // Random delivery time
      } else if (order.status === OrderStatus.SHIPPED) {
        shipmentStatus = ShipmentStatus.IN_TRANSIT
      } else if (order.status === OrderStatus.PROCESSING) {
        shipmentStatus = ShipmentStatus.PICKED_UP
      }
      
      const shipment = await prisma.shipment.create({
        data: {
          orderId: order.id,
          carrier: carrier,
          trackingNumber: trackingNumber,
          status: shipmentStatus,
          slaDeadline: new Date(order.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days SLA
          estimatedDelivery: new Date(order.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days estimated
          actualDelivery: actualDelivery,
          shippingCost: order.shippingCost || 200
        }
      })
      shipments.push(shipment)
    }
  }

  console.log('✅ Created shipments')

  // Create payouts for vendors with completed transactions
  const payouts = []
  const vendorPayoutTotals = new Map()
  
  // Calculate total payouts per vendor
  for (const transaction of transactions) {
    if (transaction.status === TransactionStatus.COMPLETED) {
      const currentTotal = vendorPayoutTotals.get(transaction.vendorId) || 0
      vendorPayoutTotals.set(transaction.vendorId, currentTotal + transaction.netPayout)
    }
  }
  
  // Create payouts for vendors with sufficient amounts
  for (const [vendorId, totalAmount] of vendorPayoutTotals) {
    if (totalAmount >= 1000) { // Minimum payout threshold
      const vendor = vendorProfiles.find(v => v.id === vendorId)
      if (vendor) {
        const payoutDate = new Date()
        payoutDate.setDate(payoutDate.getDate() - Math.floor(Math.random() * 30)) // Random date in last 30 days
        
        const payout = await prisma.payout.create({
          data: {
            vendorId: vendorId,
            amount: totalAmount,
            scheduledDate: payoutDate,
            status: PayoutStatus.COMPLETED,
            paymentMethod: 'bank_transfer',
            paymentId: `payout_${vendorId.substring(0, 8)}_${Date.now()}`,
            processedAt: payoutDate,
            metadata: {
              transactionCount: transactions.filter(t => t.vendorId === vendorId && t.status === TransactionStatus.COMPLETED).length,
              period: 'Monthly'
            }
          }
        })
        payouts.push(payout)
      }
    }
  }

  console.log('✅ Created payouts')

  // Create logistics config for all vendors
  const logisticsConfigs = await Promise.all(
    vendorProfiles.map(vendor => 
      prisma.logisticsConfig.create({
        data: {
          vendorId: vendor.id,
          shippingZones: [
            {
              name: 'Metro Manila',
              countries: ['Philippines'],
              provinces: ['Metro Manila'],
              rates: [
                { weight: 1, price: 150 },
                { weight: 5, price: 250 },
                { weight: 10, price: 400 }
              ]
            },
            {
              name: 'Luzon',
              countries: ['Philippines'],
              provinces: ['Central Luzon', 'CALABARZON', 'MIMAROPA', 'Bicol'],
              rates: [
                { weight: 1, price: 200 },
                { weight: 5, price: 350 },
                { weight: 10, price: 550 }
              ]
            },
            {
              name: 'Visayas & Mindanao',
              countries: ['Philippines'],
              provinces: ['Cebu', 'Davao', 'Iloilo', 'Cagayan de Oro'],
              rates: [
                { weight: 1, price: 300 },
                { weight: 5, price: 500 },
                { weight: 10, price: 800 }
              ]
            }
          ],
          carriers: [
            {
              name: 'LBC Express',
              code: 'LBC',
              trackingUrl: 'https://www.lbcexpress.com/track/?trackingNumber=',
              supportedZones: ['Metro Manila', 'Luzon', 'Visayas & Mindanao']
            },
            {
              name: 'J&T Express',
              code: 'JNT',
              trackingUrl: 'https://www.jtexpress.ph/track/?trackingNumber=',
              supportedZones: ['Metro Manila', 'Luzon', 'Visayas & Mindanao']
            },
            {
              name: '2GO Express',
              code: '2GO',
              trackingUrl: 'https://www.2go.com.ph/track/?trackingNumber=',
              supportedZones: ['Luzon', 'Visayas & Mindanao']
            },
            {
              name: 'Grab Express',
              code: 'GRAB',
              trackingUrl: 'https://www.grab.com/ph/express/track/?trackingNumber=',
              supportedZones: ['Metro Manila']
            }
          ],
          slaDefinitions: [
            {
              zone: 'Metro Manila',
              standard: 1,
              express: 1,
              sameDay: 1
            },
            {
              zone: 'Luzon',
              standard: 2,
              express: 1,
              sameDay: 1
            },
            {
              zone: 'Visayas & Mindanao',
              standard: 3,
              express: 2,
              sameDay: 1
            }
          ],
          autoFulfillment: true,
          trackingEnabled: true
        }
      })
    )
  )

  console.log('✅ Created logistics configs')

  // Create vendor payout settings
  const payoutSettings = await Promise.all(
    vendorProfiles.map(vendor => 
      prisma.vendorPayoutSettings.create({
        data: {
          vendorId: vendor.id,
          payoutFrequency: 'WEEKLY',
          minimumPayout: 1000,
          payoutMethod: 'BANK_TRANSFER',
          bankAccountDetails: {
            bankName: 'BDO',
            accountNumber: `****${Math.floor(Math.random() * 10000)}`,
            accountName: vendor.businessName
          },
          isActive: true,
          lastPayoutDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          nextPayoutDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      })
    )
  )

  console.log('✅ Created vendor payout settings')

  // Create comprehensive reports
  const reports = await Promise.all([
    prisma.report.create({
      data: {
        type: ReportType.SALES_SUMMARY,
        title: 'Monthly Sales Summary - December 2024',
        data: {
          totalSales: 1250000,
          totalOrders: 156,
          totalVendors: 8,
          totalCustomers: 8,
          averageOrderValue: 8012,
          topSellingCategory: 'Electronics & Gadgets',
          period: {
            start: '2024-12-01',
            end: '2024-12-31'
          }
        },
        generatedBy: admin.id
      }
    }),
    prisma.report.create({
      data: {
        type: ReportType.COMMISSION_REPORT,
        title: 'Commission Report - December 2024',
        data: {
          totalCommissions: 125000,
          totalPayouts: 1125000,
          averageCommissionRate: 8.5,
          topPerformingVendor: 'TechStore PH',
          commissionBreakdown: {
            'TechStore PH': 45000,
            'Fashion Hub Manila': 25000,
            'Home Essentials QC': 20000,
            'Sports World Cebu': 15000,
            'Beauty Plus PH': 10000,
            'Gadget Central': 8000,
            'Fashion Forward Davao': 5000,
            'Home Decor PH': 3000
          }
        },
        generatedBy: finance.id
      }
    }),
    prisma.report.create({
      data: {
        type: ReportType.VENDOR_PERFORMANCE,
        title: 'Vendor Performance Report - Q4 2024',
        data: {
          totalVendors: 8,
          activeVendors: 8,
          newVendors: 2,
          averageRating: 4.7,
          topPerformers: [
            { name: 'TechStore PH', sales: 450000, orders: 45, rating: 4.9 },
            { name: 'Fashion Hub Manila', sales: 250000, orders: 35, rating: 4.8 },
            { name: 'Home Essentials QC', sales: 200000, orders: 25, rating: 4.7 }
          ]
        },
        generatedBy: admin.id
      }
    }),
    prisma.report.create({
      data: {
        type: ReportType.LOGISTICS_REPORT,
        title: 'Logistics Performance Report - December 2024',
        data: {
          totalShipments: 156,
          onTimeDelivery: 94.2,
          averageDeliveryTime: 2.1,
          carrierPerformance: {
            'LBC Express': { shipments: 45, onTime: 95.6, avgTime: 1.8 },
            'J&T Express': { shipments: 38, onTime: 92.1, avgTime: 2.2 },
            '2GO Express': { shipments: 35, onTime: 94.3, avgTime: 2.3 },
            'Grab Express': { shipments: 38, onTime: 94.7, avgTime: 1.9 }
          }
        },
        generatedBy: operations.id
      }
    }),
    prisma.report.create({
      data: {
        type: ReportType.FINANCIAL_SUMMARY,
        title: 'Financial Summary - December 2024',
        data: {
          totalRevenue: 1250000,
          totalCommissions: 125000,
          netRevenue: 1125000,
          totalPayouts: 1125000,
          pendingPayouts: 45000,
          averageTransactionValue: 8012,
          paymentMethodBreakdown: {
            'credit_card': 85,
            'gcash': 10,
            'paymaya': 5
          }
        },
        generatedBy: finance.id
      }
    })
  ])

  console.log('✅ Created comprehensive reports')


  console.log('🎉 Comprehensive database seeded successfully!')
  console.log('\n📊 Data Summary:')
  console.log(`• ${categories.length} categories created`)
  console.log(`• ${vendorUsers.length} vendor users created`)
  console.log(`• ${customerUsers.length} customer users created`)
  console.log(`• ${products.length} products created`)
  console.log(`• ${orders.length} orders created`)
  console.log(`• ${transactions.length} transactions created`)
  console.log(`• ${commissions.length} commissions created`)
  console.log(`• ${shipments.length} shipments created`)
  console.log(`• ${payouts.length} payouts created`)
  console.log(`• ${reports.length} reports created`)
  
  console.log('\n📋 Test Accounts:')
  console.log('Admin: admin@ecommerce.com / admin123')
  console.log('Finance: finance@ecommerce.com / finance123')
  console.log('Operations: operations@ecommerce.com / ops123')
  console.log('Vendors: All vendor emails with password "vendor123"')
  console.log('Customers: All customer emails with password "customer123"')
  
  console.log('\n🏪 Vendor Accounts:')
  philippineVendors.forEach((vendor, index) => {
    console.log(`${index + 1}. ${vendor.businessName}: ${vendor.email} / vendor123`)
  })
  
  console.log('\n👥 Customer Accounts:')
  philippineCustomers.forEach((customer, index) => {
    console.log(`${index + 1}. ${customer.name}: ${customer.email} / customer123`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
