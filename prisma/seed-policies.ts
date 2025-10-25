import { PrismaClient, PolicyType, PolicySeverity } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding policies...')

  // Get admin user for audit logging
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.error('❌ No admin user found. Please create an admin user first.')
    return
  }

  // 1. Prohibited Products Policy
  const prohibitedPolicy = await prisma.policy.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Prohibited Products and Restricted Items',
      description: `TrinityCore maintains a strict policy against the sale of prohibited, illegal, or restricted items to ensure marketplace safety and legal compliance. This policy aligns with federal regulations, international trade laws, and industry best practices.

PROHIBITED ITEMS INCLUDE:
• Weapons, firearms, ammunition, explosives, or weapon accessories
• Illegal drugs, controlled substances, or drug paraphernalia
• Counterfeit, replica, or unauthorized goods infringing on intellectual property
• Stolen property or items obtained through illegal means
• Hazardous materials without proper certification
• Items that violate export control or sanctions regulations

EXAMPLES OF VIOLATIONS:
• Listing "replica designer handbag" or "fake Rolex watch"
• Selling items with keywords like "weapon," "firearm," or "explosive"
• Offering pharmaceutical products without proper licensing
• Marketing counterfeit electronics or unauthorized brand merchandise

CONSEQUENCES:
• Immediate product removal and account suspension
• Permanent ban for repeat violations
• Legal action and law enforcement notification when applicable
• Forfeiture of all pending payments and account balance

This policy is enforced automatically and manually reviewed. Vendors are responsible for ensuring all listings comply with local, state, federal, and international laws. For questions about specific items, contact our compliance team before listing.`,
      type: PolicyType.PROHIBITED_PRODUCT,
      severity: PolicySeverity.CRITICAL,
      autoEnforce: true,
      rules: [
        {
          type: 'PROHIBITED_KEYWORD',
          value: ['weapon', 'gun', 'firearm', 'ammunition', 'explosive', 'bomb', 'drug', 'narcotic', 'cocaine', 'heroin', 'marijuana', 'cannabis', 'illegal', 'counterfeit', 'fake', 'replica', 'knockoff', 'stolen', 'hazardous', 'radioactive'],
          message: 'Product contains prohibited keywords indicating illegal, dangerous, or counterfeit items'
        }
      ]
    }
  })

  // 2. Minimum Price Policy
  const minPricePolicy = await prisma.policy.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Minimum Product Price Standard',
      description: `To maintain marketplace quality, prevent fraudulent listings, and ensure sustainable vendor operations, TrinityCore requires all products to meet a minimum price threshold of $1.00 USD.

PURPOSE:
• Prevent spam and low-quality listings that degrade marketplace trust
• Ensure vendors can sustainably operate and fulfill orders
• Discourage fraudulent "bait and switch" pricing tactics
• Maintain platform processing fee viability
• Align with industry standards (similar to Etsy, Amazon Handmade)

MINIMUM PRICE REQUIREMENT:
• All products must be priced at $1.00 USD or higher
• Price must reflect the actual selling price (not placeholder or $0.00)
• Shipping costs cannot be used to circumvent minimum price requirements
• Discounts and promotions must not reduce final price below $1.00

EXAMPLES OF VIOLATIONS:
• Listing a product at $0.50 or $0.99
• Setting price to $0.01 with inflated shipping costs
• Using placeholder prices like $0.00 or $0.10

CONSEQUENCES:
• Automatic product rejection during listing creation
• Existing products flagged for immediate price correction
• Repeated violations may result in vendor account review
• Products remain unpublished until pricing is corrected

EXEMPTIONS:
• Digital downloads may be eligible for lower pricing with prior approval
• Promotional items during platform-approved campaigns
• Contact marketplace support for exemption requests

This policy is automatically enforced at product creation and update. Vendors should price products fairly to reflect value, materials, and labor costs.`,
      type: PolicyType.PRICING,
      severity: PolicySeverity.MEDIUM,
      autoEnforce: true,
      rules: [
        {
          type: 'PRICE_LIMIT',
          condition: 'MIN',
          value: 1.00,
          message: 'Product price is below minimum allowed ($1.00 USD). Please set a price of at least $1.00 to maintain marketplace quality standards.'
        }
      ]
    }
  })

  // 3. Maximum Price Policy
  const maxPricePolicy = await prisma.policy.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Maximum Product Price Limit',
      description: `To protect buyers from fraudulent pricing, prevent money laundering, and ensure appropriate payment processing, TrinityCore enforces a maximum product price limit of $10,000 USD without special approval.

PURPOSE:
• Protect buyers from price manipulation and fraud
• Prevent money laundering and financial crimes
• Ensure payment processor compliance and fraud prevention
• Maintain appropriate insurance coverage for high-value items
• Align with anti-fraud best practices

MAXIMUM PRICE LIMIT:
• Standard products cannot exceed $10,000 USD per unit
• High-value items require manual review and approval
• Luxury goods, collectibles, and specialty items may qualify for exemption
• Vendors must provide documentation for items over $10,000

APPROVAL PROCESS FOR HIGH-VALUE ITEMS:
• Submit detailed product documentation and authenticity certificates
• Provide proof of ownership and legal right to sell
• Complete enhanced vendor verification process
• Obtain insurance coverage for high-value shipments
• Agree to additional fraud prevention measures

EXAMPLES OF VIOLATIONS:
• Listing a standard product at $15,000 without approval
• Inflating prices to circumvent payment limits
• Using high prices for money laundering purposes

CONSEQUENCES:
• Products flagged for manual review before publication
• Vendor account review for suspicious pricing patterns
• Potential account suspension for fraudulent activity
• Cooperation with law enforcement if illegal activity suspected

EXEMPTIONS:
• Authenticated luxury goods (jewelry, watches, art) with proper documentation
• Rare collectibles with verified provenance
• Custom manufacturing or bulk orders with contracts
• Contact our high-value items team: highvalue@trinitycore.com

This policy requires manual review and is not automatically enforced. Flagged products will be reviewed within 24-48 hours.`,
      type: PolicyType.PRICING,
      severity: PolicySeverity.HIGH,
      autoEnforce: false,
      rules: [
        {
          type: 'PRICE_LIMIT',
          condition: 'MAX',
          value: 10000.00,
          message: 'Product price exceeds maximum allowed ($10,000 USD). High-value items require manual approval and documentation. Please contact support or reduce the price.'
        }
      ]
    }
  })

  // 4. Product Images Required
  const imagesPolicy = await prisma.policy.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Product Image Requirements',
      description: `High-quality product images are essential for buyer confidence and marketplace success. TrinityCore requires all products to include at least one clear, accurate product photograph that represents the actual item being sold.

PURPOSE:
• Enable buyers to make informed purchasing decisions
• Reduce returns and disputes from misrepresented products
• Maintain professional marketplace appearance
• Comply with e-commerce best practices and consumer protection laws
• Improve search visibility and conversion rates

IMAGE REQUIREMENTS:
• Minimum: At least ONE high-quality product image required
• Recommended: 3-5 images showing different angles and details
• Images must accurately represent the actual product being sold
• Photos should be clear, well-lit, and in focus
• Minimum resolution: 500x500 pixels (1000x1000 recommended)
• Accepted formats: JPG, PNG, WebP

PROHIBITED IMAGE PRACTICES:
• Stock photos that don't match the actual product
• Images with watermarks from other sellers or websites
• Blurry, dark, or low-quality photographs
• Images containing prohibited content or misleading information
• Using placeholder images or "image coming soon" graphics
• Photos of products in packaging only (must show actual item)

BEST PRACTICES:
• Use natural lighting or professional photography
• Show product from multiple angles (front, back, side, detail shots)
• Include size reference or scale when relevant
• Display product features, textures, and unique characteristics
• For clothing: show fit on model or mannequin
• For electronics: show product powered on and functional

EXAMPLES OF VIOLATIONS:
• Listing a product with no images
• Using only a manufacturer's stock photo for handmade items
• Uploading blurry or pixelated images
• Showing a different product than what's being sold

CONSEQUENCES:
• Automatic product rejection during listing creation
• Existing products unpublished until images are added
• Reduced search visibility for low-quality images
• Potential account review for repeated violations

This policy is automatically enforced. Products without images cannot be published. Vendors should invest in quality photography to maximize sales success.`,
      type: PolicyType.QUALITY_STANDARD,
      severity: PolicySeverity.MEDIUM,
      autoEnforce: true,
      rules: [
        {
          type: 'IMAGE_REQUIRED',
          message: 'Product must have at least one high-quality image. Please upload a clear photograph of the actual item being sold.'
        }
      ]
    }
  })

  // 5. Description Length Policy
  const descriptionPolicy = await prisma.policy.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Product Description Quality Standards',
      description: `Detailed, accurate product descriptions are essential for buyer satisfaction and reducing returns. TrinityCore requires all product listings to include meaningful descriptions of at least 20 characters that accurately represent the item.

PURPOSE:
• Provide buyers with essential product information
• Reduce returns and disputes from unclear expectations
• Improve search engine optimization (SEO) and discoverability
• Comply with consumer protection and truth-in-advertising laws
• Enhance overall marketplace quality and professionalism

DESCRIPTION REQUIREMENTS:
• Minimum length: 20 characters (recommended: 100-500 characters)
• Must accurately describe the product being sold
• Should include key features, materials, dimensions, and specifications
• Must be written in clear, grammatically correct language
• Should address common buyer questions

WHAT TO INCLUDE:
• Product name and category
• Key features and benefits
• Materials, ingredients, or components
• Dimensions, size, weight, or capacity
• Color, style, or design details
• Intended use or target audience
• Care instructions or usage guidelines
• What's included in the purchase
• Manufacturing details (handmade, vintage, new, etc.)

PROHIBITED DESCRIPTION PRACTICES:
• Vague descriptions like "Nice item" or "Good product"
• Misleading or false claims about product features
• Keyword stuffing for SEO manipulation
• Copying descriptions from other sellers without permission
• Including contact information or external links
• Using excessive capitalization or special characters
• Promotional language that violates advertising policies

EXAMPLES OF VIOLATIONS:
• Description: "Great!" (only 6 characters)
• Description: "Product for sale" (generic, uninformative)
• Description: "BEST DEAL EVER!!!" (promotional spam)

EXAMPLES OF GOOD DESCRIPTIONS:
• "Premium 100% organic cotton t-shirt with crew neck. Soft, breathable fabric perfect for everyday wear. Available in sizes S-XXL. Machine washable. Ethically manufactured."
• "Handcrafted ceramic coffee mug, 12oz capacity. Microwave and dishwasher safe. Each piece is unique with slight variations in glaze. Dimensions: 4" height x 3" diameter."

CONSEQUENCES:
• Products flagged for review and improvement
• Reduced search visibility for low-quality descriptions
• Vendor notification to update description
• Repeated violations may affect account standing

This policy is monitored but not automatically enforced. Vendors are encouraged to provide detailed, helpful descriptions to maximize sales and customer satisfaction.`,
      type: PolicyType.QUALITY_STANDARD,
      severity: PolicySeverity.LOW,
      autoEnforce: false,
      rules: [
        {
          type: 'DESCRIPTION_LENGTH',
          condition: 'MIN',
          value: 20,
          message: 'Product description is too short (minimum 20 characters). Please provide a detailed description including features, materials, dimensions, and other relevant information.'
        }
      ]
    }
  })

  // 6. Content Restriction Policy
  const contentPolicy = await prisma.policy.upsert({
    where: { id: '00000000-0000-0000-0000-000000000006' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000006',
      name: 'Prohibited Content and Community Standards',
      description: `TrinityCore is committed to maintaining a safe, inclusive, and family-friendly marketplace. Products containing inappropriate, offensive, explicit, or harmful content are strictly prohibited to protect our community and comply with legal requirements.

PURPOSE:
• Maintain a safe shopping environment for all users
• Protect minors from inappropriate content
• Comply with obscenity laws and community standards
• Prevent harassment, hate speech, and discrimination
• Uphold brand reputation and advertiser relationships
• Align with payment processor acceptable use policies

PROHIBITED CONTENT CATEGORIES:

1. ADULT/EXPLICIT CONTENT:
• Sexually explicit products, images, or descriptions
• Adult toys, pornography, or sexual services
• Nudity or sexually suggestive imagery
• Products marketed for sexual purposes

2. HATE SPEECH & DISCRIMINATION:
• Products promoting racism, sexism, or bigotry
• Items featuring hate symbols or extremist ideology
• Content targeting protected classes (race, religion, gender, etc.)
• Harassment or bullying materials

3. VIOLENCE & HARM:
• Products glorifying violence or criminal activity
• Instructions for illegal activities or self-harm
• Graphic violence or gore imagery
• Items promoting dangerous challenges or activities

4. OFFENSIVE CONTENT:
• Profanity or vulgar language in product titles/descriptions
• Culturally insensitive or appropriative items
• Mockery of tragedies, disasters, or sensitive events
• Content intended to shock, offend, or disturb

5. MISLEADING HEALTH CLAIMS:
• Unproven medical treatments or miracle cures
• Products claiming to cure diseases without FDA approval
• Dangerous health advice or anti-vaccine propaganda

6. INTELLECTUAL PROPERTY VIOLATIONS:
• Unauthorized use of copyrighted material
• Trademark infringement or brand impersonation
• Pirated digital content or software

EXAMPLES OF VIOLATIONS:
• T-shirt with explicit sexual imagery or profanity
• Products featuring hate symbols or discriminatory messages
• Items marketed as "adult only" or "explicit"
• Listings with offensive language in titles or descriptions
• Products mocking tragedies or protected groups

CONSEQUENCES:
• Immediate product removal without warning
• Account suspension or permanent ban
• Forfeiture of pending payments
• Legal action for severe violations
• Reporting to law enforcement when applicable
• Cooperation with intellectual property rights holders

REPORTING VIOLATIONS:
Buyers and vendors can report inappropriate content to: abuse@trinitycore.com
Reports are reviewed within 24 hours and handled confidentially.

APPEALS:
Vendors who believe their product was incorrectly flagged may appeal by providing:
• Detailed explanation of product purpose and context
• Evidence that content complies with policies
• Willingness to modify listing if needed

This policy is automatically enforced with keyword detection and manually reviewed. TrinityCore reserves the right to remove any content deemed inappropriate at our sole discretion.`,
      type: PolicyType.CONTENT_RESTRICTION,
      severity: PolicySeverity.CRITICAL,
      autoEnforce: true,
      rules: [
        {
          type: 'PROHIBITED_KEYWORD',
          value: ['explicit', 'adult', 'xxx', 'porn', 'sexual', 'nude', 'nudity', 'offensive', 'racist', 'sexist', 'hate', 'nazi', 'supremacist', 'slur', 'profanity', 'vulgar', 'obscene', 'inappropriate'],
          message: 'Product contains prohibited content that violates community standards. Content must be appropriate for all audiences and comply with our content policy.'
        }
      ]
    }
  })

  // Log policy creation
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SEED_POLICIES',
      resource: 'POLICY',
      resourceId: 'SEED',
      details: {
        policiesCreated: 6,
        timestamp: new Date().toISOString()
      }
    }
  })

  console.log('✅ Successfully seeded 6 comprehensive policies:')
  console.log('  1. Prohibited Products and Restricted Items (CRITICAL, Auto-Enforce)')
  console.log('  2. Minimum Product Price Standard (MEDIUM, Auto-Enforce)')
  console.log('  3. Maximum Product Price Limit (HIGH, Manual Review)')
  console.log('  4. Product Image Requirements (MEDIUM, Auto-Enforce)')
  console.log('  5. Product Description Quality Standards (LOW, Advisory)')
  console.log('  6. Prohibited Content and Community Standards (CRITICAL, Auto-Enforce)')
  console.log('\n📋 All policies include detailed descriptions, examples, and consequences.')
  console.log('🔍 Policies align with industry standards (Amazon, eBay, Etsy).')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding policies:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

